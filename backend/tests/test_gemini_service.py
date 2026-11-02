import asyncio
import json
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, call, patch

from fastapi import HTTPException
from google.genai.errors import APIError, ServerError

from app.routes.interviews import evaluate_answer, generate_questions
from app.schemas.interview import AnswerEvaluationRequest, QuestionGenerationRequest
from app.services.gemini_service import (
    EVALUATION_RESPONSE_SCHEMA,
    FALLBACK_FLASH_MODEL,
    PRIMARY_FLASH_MODEL,
    QUESTION_RESPONSE_SCHEMA,
    GeminiConfigurationError,
    GeminiRequestError,
    GeminiResponseError,
    GeminiService,
    GeminiUnavailableError,
    gemini_service,
)


class GeminiServiceTests(unittest.TestCase):
    def setUp(self):
        self.service = object.__new__(GeminiService)
        self.service.api_key = "test-key"
        self.service.client = SimpleNamespace(models=SimpleNamespace(
            generate_content=Mock()
        ))
        self.sleep = patch("app.services.gemini_service.time.sleep")
        self.sleep_mock = self.sleep.start()
        self.addCleanup(self.sleep.stop)

    @staticmethod
    def _provider_error(status_code):
        error_type = ServerError if status_code >= 500 else APIError
        return error_type(
            code=status_code,
            response_json={"error": {"message": "temporary provider error"}},
        )

    @staticmethod
    def _evaluation_payload(**overrides):
        payload = {
            "score": 82,
            "verdict": "Mostly Correct",
            "what_was_correct": ["Explained the key idea."],
            "what_was_wrong": ["The example needs clarification."],
            "missing_concepts": ["Mention the trade-off."],
            "concept_explanation": "This concept describes how work is scheduled.",
            "suggestions": ["Add a concrete example."],
            "explanation": "The answer is accurate but misses a useful detail.",
            "improved_answer": "A concise ideal answer with a relevant example.",
        }
        payload.update(overrides)
        return payload

    def test_primary_429_switches_to_fallback_without_retry_or_delay(self):
        generate = self.service.client.models.generate_content
        generate.side_effect = [
            self._provider_error(429),
            SimpleNamespace(text="ok"),
        ]

        self.assertEqual(self.service._generate_content("prompt"), "ok")
        self.assertEqual(
            [entry.kwargs["model"] for entry in generate.call_args_list],
            [PRIMARY_FLASH_MODEL, FALLBACK_FLASH_MODEL],
        )
        self.sleep_mock.assert_not_called()

    def test_primary_503_gets_one_short_retry_then_switches_to_fallback(self):
        generate = self.service.client.models.generate_content
        generate.side_effect = [
            self._provider_error(503),
            self._provider_error(503),
            SimpleNamespace(text="ok"),
        ]

        self.assertEqual(self.service._generate_content("prompt"), "ok")
        self.assertEqual(
            [entry.kwargs["model"] for entry in generate.call_args_list],
            [PRIMARY_FLASH_MODEL, PRIMARY_FLASH_MODEL, FALLBACK_FLASH_MODEL],
        )
        self.assertEqual(self.sleep_mock.call_args_list, [call(0.5)])

    def test_both_models_unavailable_returns_retryable_error(self):
        generate = self.service.client.models.generate_content
        generate.side_effect = self._provider_error(503)

        with self.assertRaisesRegex(GeminiUnavailableError, "temporarily unavailable"):
            self.service._generate_content("prompt")

        self.assertEqual(
            [entry.kwargs["model"] for entry in generate.call_args_list],
            [PRIMARY_FLASH_MODEL, PRIMARY_FLASH_MODEL, FALLBACK_FLASH_MODEL, FALLBACK_FLASH_MODEL],
        )
        self.assertEqual(self.sleep_mock.call_args_list, [call(0.5), call(0.5)])

    def test_authentication_and_invalid_request_errors_are_not_retried(self):
        generate = self.service.client.models.generate_content
        for error, expected_error in (
            (self._provider_error(401), GeminiConfigurationError),
            (self._provider_error(400), GeminiRequestError),
        ):
            with self.subTest(status=error.code):
                generate.reset_mock()
                generate.side_effect = error
                self.sleep_mock.reset_mock()

                with self.assertRaises(expected_error):
                    self.service._generate_content("prompt")

                generate.assert_called_once()
                self.assertEqual(generate.call_args.kwargs["model"], PRIMARY_FLASH_MODEL)
                self.sleep_mock.assert_not_called()

    def test_question_generation_uses_structured_json_and_validates_distinct_questions(self):
        payload = {
            "questions": [
                {"question": "How does a hash map work?", "category": "Data Structures", "hints": ["Hashing", "Collisions"]},
                {"question": "How would you design a REST API?", "category": "Web", "hints": ["Resources", "Status codes"]},
            ]
        }
        generate = self.service.client.models.generate_content
        generate.return_value = SimpleNamespace(text=json.dumps(payload))

        result = self.service.generate_interview_questions(
            "Software Engineer", "Technical", "Medium", 2, ["Python"]
        )

        self.assertEqual(len(result["questions"]), 2)
        self.assertEqual(result["is_mock_response"], False)
        config = generate.call_args.kwargs["config"]
        self.assertEqual(config.response_mime_type, "application/json")
        self.assertEqual(config.response_schema, QUESTION_RESPONSE_SCHEMA)
        self.assertEqual(generate.call_args.kwargs["model"], PRIMARY_FLASH_MODEL)

    def test_duplicate_question_is_repaired_once(self):
        duplicate_questions = {
            "questions": [
                {"question": "Explain a hash map.", "category": "Data Structures", "hints": ["Hashing", "Keys"]},
                {"question": "EXPLAIN A HASH MAP!", "category": "Data Structures", "hints": ["Buckets", "Values"]},
            ]
        }
        repaired_questions = {
            "questions": [
                duplicate_questions["questions"][0],
                {"question": "How does a binary search tree work?", "category": "Trees", "hints": ["Ordering", "Search"]},
            ]
        }
        generate = self.service.client.models.generate_content
        generate.side_effect = [
            SimpleNamespace(text=json.dumps(duplicate_questions)),
            SimpleNamespace(text=json.dumps(repaired_questions)),
        ]

        result = self.service.generate_interview_questions(
            "Software Engineer", "Technical", "Medium", 2, ["Python"]
        )

        self.assertEqual(generate.call_count, 2)
        self.assertIn("Repair this malformed question generation", generate.call_args_list[1].kwargs["contents"])
        self.assertEqual(len({item["question"].casefold() for item in result["questions"]}), 2)

    def test_answer_evaluation_parses_escaped_quotes_and_newlines_with_structured_json(self):
        answer = 'It handles "quoted" text.\nNext line uses a backslash: \\.'
        expected = self._evaluation_payload(
            explanation='The answer includes "quoted" text.\nIt is clearly explained.'
        )
        generate = self.service.client.models.generate_content
        generate.return_value = SimpleNamespace(text=json.dumps(expected))

        result = self.service.evaluate_answer(
            "Software Engineer",
            "Technical",
            'Explain "JSON" parsing.\nInclude an example.',
            answer,
            topic="Serialization",
        )

        self.assertEqual(result["explanation"], expected["explanation"])
        self.assertEqual(result["improved_answer"], expected["improved_answer"])
        self.assertEqual(result["is_mock_response"], False)
        config = generate.call_args.kwargs["config"]
        self.assertEqual(config.response_mime_type, "application/json")
        self.assertEqual(config.response_schema, EVALUATION_RESPONSE_SCHEMA)
        prompt = generate.call_args.kwargs["contents"]
        self.assertIn(json.dumps(answer, ensure_ascii=False), prompt)

    def test_malformed_evaluation_gets_at_most_one_repair_attempt(self):
        expected = self._evaluation_payload()
        generate = self.service.client.models.generate_content
        generate.side_effect = [
            SimpleNamespace(text='{"score": 82, "explanation": "unfinished'),
            SimpleNamespace(text=json.dumps(expected)),
        ]

        result = self.service.evaluate_answer(
            "Software Engineer",
            "Technical",
            "Explain a useful concept.",
            "Here is my answer.",
        )

        self.assertEqual(result["score"], 82)
        self.assertEqual(generate.call_count, 2)
        self.assertIn("Repair this malformed answer evaluation", generate.call_args_list[1].kwargs["contents"])

    def test_invalid_evaluation_after_repair_is_not_returned_as_success(self):
        generate = self.service.client.models.generate_content
        generate.side_effect = [
            SimpleNamespace(text="not json"),
            SimpleNamespace(text="still not json"),
        ]

        with self.assertRaises(GeminiResponseError):
            self.service.evaluate_answer(
                "Software Engineer",
                "Technical",
                "Explain a useful concept.",
                "Here is my answer.",
            )

        self.assertEqual(generate.call_count, 2)

    def test_both_interview_routes_return_retryable_unavailable_responses(self):
        test_cases = (
            (
                generate_questions,
                "generate_interview_questions",
                QuestionGenerationRequest(),
            ),
            (
                evaluate_answer,
                "evaluate_answer",
                AnswerEvaluationRequest(
                    question="Explain a useful concept.",
                    user_answer="A short answer.",
                ),
            ),
        )

        for endpoint, service_method, payload in test_cases:
            with self.subTest(endpoint=endpoint.__name__):
                with patch.object(
                    gemini_service,
                    service_method,
                    side_effect=GeminiUnavailableError(
                        "Gemini is temporarily unavailable. Please retry in a few moments."
                    ),
                ):
                    with self.assertRaises(HTTPException) as raised:
                        asyncio.run(endpoint(payload))

                self.assertEqual(raised.exception.status_code, 503)
                self.assertEqual(
                    raised.exception.detail["code"],
                    "gemini_temporarily_unavailable",
                )
                self.assertIn("temporarily unavailable", raised.exception.detail["message"])


if __name__ == "__main__":
    unittest.main()
