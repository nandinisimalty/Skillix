import json
import logging
import re
import time
from collections.abc import Callable
from app.config import settings

logger = logging.getLogger(__name__)

PRIMARY_FLASH_MODEL = "gemini-3.6-flash"
FALLBACK_FLASH_MODEL = "gemini-3.5-flash-lite"
TRANSIENT_RETRY_LIMIT = 1
TRANSIENT_RETRY_DELAY_SECONDS = 0.5

QUESTION_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "questions": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "question": {"type": "STRING"},
                    "category": {"type": "STRING"},
                    "hints": {"type": "ARRAY", "items": {"type": "STRING"}},
                },
                "required": ["question", "category", "hints"],
            },
        },
    },
    "required": ["questions"],
}

EVALUATION_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "score": {"type": "INTEGER"},
        "verdict": {
            "type": "STRING",
            "enum": ["Correct", "Mostly Correct", "Partially Correct", "Incorrect"],
        },
        "what_was_correct": {"type": "ARRAY", "items": {"type": "STRING"}},
        "what_was_wrong": {"type": "ARRAY", "items": {"type": "STRING"}},
        "missing_concepts": {"type": "ARRAY", "items": {"type": "STRING"}},
        "concept_explanation": {"type": "STRING"},
        "suggestions": {"type": "ARRAY", "items": {"type": "STRING"}},
        "explanation": {"type": "STRING"},
        "improved_answer": {"type": "STRING"},
    },
    "required": [
        "score",
        "verdict",
        "what_was_correct",
        "what_was_wrong",
        "missing_concepts",
        "concept_explanation",
        "suggestions",
        "explanation",
        "improved_answer",
    ],
}


class GeminiConfigurationError(RuntimeError):
    pass


class GeminiRequestError(RuntimeError):
    pass


class GeminiUnavailableError(GeminiRequestError):
    pass


class GeminiResponseError(RuntimeError):
    pass


class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        self._init_gemini()

    def _redact_api_key(self, message: str) -> str:
        if self.api_key:
            return message.replace(self.api_key, "[REDACTED]")
        return message

    def _init_gemini(self):
        if not self.api_key:
            logger.error("GEMINI_API_KEY is not configured; interview AI endpoints will be unavailable.")
            return

        try:
            from google import genai
            from google.genai import types

            self.client = genai.Client(
                api_key=self.api_key,
                http_options=types.HttpOptions(
                    retry_options=types.HttpRetryOptions(attempts=1)
                ),
            )
            logger.info("Gemini client initialized successfully with google-genai.")
        except Exception as e:
            logger.error(
                "Could not initialize google-genai SDK (%s).",
                self._redact_api_key(str(e)),
            )
            self.client = None

    def _require_gemini_client(self):
        if not self.api_key:
            raise GeminiConfigurationError(
                "GEMINI_API_KEY is missing from the backend environment."
            )
        if not self.client:
            raise GeminiConfigurationError(
                "The Gemini client could not be initialized. Check the backend SDK and key configuration."
            )

    def analyze_resume(self, resume_text: str, target_role: str = "Software Engineer") -> dict:
        prompt = f"""
        Act as an expert technical recruiter and resume reviewer. Analyze the following candidate resume text for a target role of '{target_role}'.
        Return a strict raw JSON object without markdown fences with the following key names:
        - "detected_skills": list of strings (e.g. programming languages, frameworks, tools)
        - "education": list of strings (degrees, institutions)
        - "projects": list of strings (project names/summaries)
        - "experience": list of strings (internships, positions)
        - "strengths": list of 3-5 key strength points
        - "areas_for_improvement": list of 3-5 specific gaps or missing details
        - "suggestions": list of 3-5 actionable recommendations to make the resume stand out
        - "possible_interview_questions": list of 5 targeted technical and behavioral interview questions based directly on this resume
        - "summary": concise 2-sentence executive summary

        Resume Text:
        ---
        {resume_text[:4000]}
        ---
        """

        if self.client and self.api_key:
            try:
                response_text = self._generate_content(prompt)
                clean_json = self._clean_json_string(response_text)
                parsed = json.loads(clean_json)
                parsed["is_mock_response"] = False
                return parsed
            except Exception as e:
                logger.error(f"Gemini API error during resume analysis: {str(e)}. Falling back to fallback analyzer.")

        # Fallback structured resume analysis
        return self._fallback_resume_analysis(resume_text, target_role)

    def generate_interview_questions(
        self,
        target_role: str,
        interview_type: str,
        difficulty: str,
        num_questions: int,
        topics: list[str],
        resume_context: str = None,
    ) -> dict:
        self._require_gemini_client()
        topics_str = ", ".join(topics) if topics else "General Core Concepts"
        prompt = f"""Generate exactly {num_questions} distinct, role-specific {difficulty} {interview_type} interview questions.
Role: {json.dumps(target_role, ensure_ascii=False)}
Focus topics: {json.dumps(topics_str, ensure_ascii=False)}
Resume context: {json.dumps(resume_context[:4000] if resume_context else "", ensure_ascii=False)}

Avoid repeating a question or testing the same concept in different wording. Make questions concrete and concise. Provide exactly two short hints per question. Return only the requested JSON object."""

        def validate_questions(parsed: dict) -> dict:
            questions = parsed.get("questions") if isinstance(parsed, dict) else None
            if not isinstance(questions, list) or len(questions) != num_questions:
                raise GeminiResponseError(
                    f"Gemini returned an invalid question list; expected exactly {num_questions} questions."
                )

            normalized_questions = []
            seen_questions = set()
            for index, item in enumerate(questions, start=1):
                if not isinstance(item, dict):
                    raise GeminiResponseError(f"Gemini question {index} was not an object.")
                question_text = item.get("question")
                category = item.get("category")
                hints = item.get("hints")
                if not isinstance(question_text, str) or not question_text.strip():
                    raise GeminiResponseError(f"Gemini question {index} has no question text.")
                if not isinstance(category, str) or not category.strip():
                    raise GeminiResponseError(f"Gemini question {index} has no category.")
                if (
                    not isinstance(hints, list)
                    or len(hints) != 2
                    or any(not isinstance(hint, str) or not hint.strip() for hint in hints)
                ):
                    raise GeminiResponseError(
                        f"Gemini question {index} must have exactly two non-empty hints."
                    )
                normalized_question = re.sub(
                    r"[\W_]+", " ", question_text.casefold(), flags=re.UNICODE
                ).strip()
                if normalized_question in seen_questions:
                    raise GeminiResponseError("Gemini returned duplicate interview questions.")
                seen_questions.add(normalized_question)
                normalized_questions.append({
                    "id": index,
                    "question": question_text.strip(),
                    "category": category.strip(),
                    "difficulty": difficulty,
                    "hints": [hint.strip() for hint in hints],
                })

            return {
                "target_role": target_role,
                "interview_type": interview_type,
                "difficulty": difficulty,
                "questions": normalized_questions,
                "is_mock_response": False,
            }

        return self._generate_validated_json(
            prompt,
            QUESTION_RESPONSE_SCHEMA,
            validate_questions,
            "question generation",
        )

    def evaluate_answer(
        self,
        target_role: str,
        interview_type: str,
        question: str,
        user_answer: str,
        topic: str = None,
        difficulty: str = "Medium",
    ) -> dict:
        self._require_gemini_client()
        relevant_topic = (topic or "General").strip() or "General"
        prompt = f"""Evaluate this interview answer fairly and specifically.
Role: {json.dumps(target_role, ensure_ascii=False)}
Interview type: {interview_type}; difficulty: {difficulty}; topic: {json.dumps(relevant_topic, ensure_ascii=False)}
Question (JSON string): {json.dumps(question, ensure_ascii=False)}
Candidate answer (JSON string): {json.dumps(user_answer, ensure_ascii=False)}

Score demonstrated correctness and completeness, not length or keywords. For HR, assess relevance, structure, professionalism, and specificity. Never claim code was run. Be concise but useful: identify strengths, mistakes, missing concepts, a beginner-friendly explanation, actionable suggestions, and an ideal answer. Ground every point in the supplied answer. Return only the JSON object matching the response schema."""

        return self._generate_validated_json(
            prompt,
            EVALUATION_RESPONSE_SCHEMA,
            self._normalize_answer_evaluation,
            "answer evaluation",
        )

    def generate_study_plan(self, target_role: str, weak_topics: list[str], recent_feedback: list) -> dict:
        weak_str = ", ".join(weak_topics) if weak_topics else "Data Structures, System Design, HR Scenarios"
        prompt = f"""
        Create a personalized 5-day study plan for a job seeker targeting '{target_role}'.
        Identified areas for improvement: {weak_str}

        Return a strict raw JSON object with:
        - "target_role": "{target_role}"
        - "recommended_topics": list of key topics to prioritize
        - "daily_goals": list of 5 day objects each with keys "day" (e.g. "Day 1"), "focus", "tasks" (list of strings)
        - "practice_questions": list of 4 recommended practice problem descriptions
        - "suggested_revision_activities": list of 3 practical exercises
        """

        if self.client and self.api_key:
            try:
                response_text = self._generate_content(prompt)
                clean_json = self._clean_json_string(response_text)
                parsed = json.loads(clean_json)
                parsed["is_mock_response"] = False
                return parsed
            except Exception as e:
                logger.error(f"Gemini API error during study plan generation: {str(e)}.")

        return self._fallback_study_plan(target_role, weak_topics)

    def _generate_validated_json(
        self,
        prompt: str,
        response_schema: dict,
        validator: Callable[[dict], dict],
        operation: str,
    ) -> dict:
        response_text = self._generate_content(prompt, response_schema)
        for repair_attempt in range(2):
            try:
                parsed = json.loads(response_text)
                if not isinstance(parsed, dict):
                    raise GeminiResponseError("Gemini returned a non-object JSON response.")
                return validator(parsed)
            except (json.JSONDecodeError, TypeError, GeminiResponseError) as exc:
                if repair_attempt == 1:
                    logger.error(
                        "Gemini returned invalid %s JSON after one repair attempt: %s",
                        operation,
                        self._redact_api_key(str(exc)),
                    )
                    raise GeminiResponseError(
                        f"Gemini returned invalid {operation} data after one repair attempt. Please retry."
                    ) from exc
                logger.warning(
                    "Gemini returned invalid %s JSON; requesting one repair: %s",
                    operation,
                    self._redact_api_key(str(exc)),
                )
                response_text = self._generate_content(
                    f"""Repair this malformed {operation} response into a single valid JSON object matching the provided response schema.
Do not add markdown, commentary, or new claims. Preserve the original meaning and content where valid.
Malformed response:
{response_text}""",
                    response_schema,
                )
        raise GeminiResponseError(f"Gemini returned invalid {operation} data.")

    def _generate_content(self, prompt: str, response_schema: dict = None) -> str:
        self._require_gemini_client()
        if hasattr(self.client, "models"):
            candidate_models = (PRIMARY_FLASH_MODEL, FALLBACK_FLASH_MODEL)
            for model_name in candidate_models:
                last_transient_error = None
                for retry_number in range(TRANSIENT_RETRY_LIMIT + 1):
                    try:
                        generation_config = None
                        if response_schema is not None:
                            from google.genai import types

                            generation_config = types.GenerateContentConfig(
                                response_mime_type="application/json",
                                response_schema=response_schema,
                            )
                        response = self.client.models.generate_content(
                            model=model_name,
                            contents=prompt,
                            config=generation_config,
                        )
                        if response and response.text and response.text.strip():
                            logger.info("Gemini request succeeded with model %s.", model_name)
                            return response.text
                        raise GeminiResponseError(
                            f"Gemini model {model_name} returned an empty response."
                        )
                    except GeminiResponseError:
                        raise
                    except Exception as exc:
                        safe_message = self._redact_api_key(str(exc))
                        status_code = self._provider_status_code(exc)
                        error_text = safe_message.lower()

                        if status_code in (401, 403) or any(marker in error_text for marker in (
                            "unauthorized",
                            "permission denied",
                            "api key not valid",
                            "api_key_invalid",
                            "invalid api key",
                        )):
                            logger.error(
                                "Gemini rejected the configured key or its API access (%s): %s",
                                type(exc).__name__,
                                safe_message,
                            )
                            raise GeminiConfigurationError(
                                "Gemini rejected the configured API key or API access. Check the backend key and Google AI API settings."
                            ) from None

                        is_quota_exhausted = (
                            status_code == 429 or "resource_exhausted" in error_text
                        )
                        is_service_unavailable = (
                            status_code == 503 or "service unavailable" in error_text
                        )
                        if is_quota_exhausted:
                            last_transient_error = exc
                            logger.warning(
                                "Gemini model %s exhausted quota; switching to fallback without retry: %s",
                                model_name,
                                safe_message,
                            )
                            break
                        if is_service_unavailable:
                            last_transient_error = exc
                            if retry_number < TRANSIENT_RETRY_LIMIT:
                                delay = TRANSIENT_RETRY_DELAY_SECONDS * (2 ** retry_number)
                                logger.warning(
                                    "Gemini model %s returned a temporary error; retry %s/%s in %s second(s): %s",
                                    model_name,
                                    retry_number + 1,
                                    TRANSIENT_RETRY_LIMIT,
                                    f"{delay:g}",
                                    safe_message,
                                )
                                time.sleep(delay)
                                continue
                            logger.warning(
                                "Gemini model %s remained unavailable after %s retries: %s",
                                model_name,
                                TRANSIENT_RETRY_LIMIT,
                                safe_message,
                            )
                            break

                        if status_code == 400 or any(marker in error_text for marker in (
                            "invalid_argument",
                            "bad request",
                        )):
                            logger.error(
                                "Gemini rejected the request (%s): %s",
                                type(exc).__name__,
                                safe_message,
                            )
                            raise GeminiRequestError(
                                "Gemini rejected the request. Check the interview input and backend logs."
                            ) from None

                        logger.error(
                            "Gemini API request failed (%s): %s",
                            type(exc).__name__,
                            safe_message,
                        )
                        raise GeminiRequestError(
                            f"Gemini API request failed ({type(exc).__name__}). Check backend logs."
                        ) from None

                if last_transient_error is None:
                    raise GeminiRequestError("Gemini did not return a usable response.")

            raise GeminiUnavailableError(
                "Gemini is temporarily unavailable. Please retry in a few moments."
            ) from None
        if hasattr(self.client, "generate_content"):
            raise GeminiConfigurationError(
                "The installed Gemini client does not support the Google GenAI models API."
            )
        raise GeminiConfigurationError("No supported Gemini SDK client is initialized.")

    @staticmethod
    def _provider_status_code(exc: Exception) -> int | None:
        response = getattr(exc, "response", None)
        for value in (
            getattr(exc, "status_code", None),
            getattr(exc, "code", None),
            getattr(exc, "status", None),
            getattr(response, "status_code", None),
        ):
            if isinstance(value, int):
                return value
            if isinstance(value, str) and value.isdigit():
                return int(value)
        return None

    def _clean_json_string(self, text: str) -> str:
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        first_brace = text.find("{")
        last_brace = text.rfind("}")
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            return text[first_brace:last_brace + 1]
        return text

    def _derive_verdict(self, score: int) -> str:
        if score >= 80:
            return "Correct"
        if score >= 65:
            return "Mostly Correct"
        if score >= 40:
            return "Partially Correct"
        return "Incorrect"

    def _normalize_answer_evaluation(self, payload: dict) -> dict:
        if not isinstance(payload, dict):
            raise GeminiResponseError("Gemini returned a non-object evaluation.")

        score_raw = payload.get("score")
        if (
            isinstance(score_raw, bool)
            or not isinstance(score_raw, (int, float))
            or not float(score_raw).is_integer()
            or not 0 <= score_raw <= 100
        ):
            raise GeminiResponseError("Gemini returned an invalid score.")
        score = int(score_raw)

        allowed_verdicts = {
            "Correct",
            "Mostly Correct",
            "Partially Correct",
            "Incorrect",
        }
        verdict = payload.get("verdict")
        if verdict not in allowed_verdicts:
            raise GeminiResponseError("Gemini returned an invalid correctness verdict.")

        def read_list(field: str, required: bool = False) -> list[str]:
            value = payload.get(field)
            if not isinstance(value, list) or any(
                not isinstance(item, str) or not item.strip() for item in value
            ):
                raise GeminiResponseError(f"Gemini returned an invalid {field} list.")
            items = [item.strip() for item in value]
            if required and not items:
                raise GeminiResponseError(f"Gemini returned no {field}.")
            return items

        def read_text(field: str) -> str:
            value = payload.get(field)
            if not isinstance(value, str) or not value.strip():
                raise GeminiResponseError(f"Gemini returned no {field}.")
            return value.strip()

        return {
            "score": score,
            "max_score": 100,
            "percentage": float(score),
            "verdict": verdict,
            "what_was_correct": read_list("what_was_correct"),
            "what_was_wrong": read_list("what_was_wrong"),
            "missing_concepts": read_list("missing_concepts"),
            "concept_explanation": read_text("concept_explanation"),
            "suggestions": read_list("suggestions", required=True),
            "explanation": read_text("explanation"),
            "improved_answer": read_text("improved_answer"),
            "is_mock_response": False,
        }

    def _build_default_model_answer(self, question: str, user_answer: str) -> str:
        if not question:
            return "A stronger answer would clearly define the concept, explain its importance, and provide a concise example."
        if "normaliz" in question.lower():
            return "Normalization is the process of organizing data to reduce redundancy and improve data integrity by splitting tables and enforcing relationships through keys and normal forms."
        return f"A stronger answer would directly address the question by explaining the core concept, giving a relevant example, and summarizing why it matters in practice."

    # --- FALLBACKS FOR OUT-OF-THE-BOX OPERATION WITHOUT API KEY ---
    def _fallback_resume_analysis(self, text: str, role: str) -> dict:
        text_lower = text.lower()
        skills = []
        for kw in ["python", "javascript", "react", "c++", "java", "sql", "html", "css", "git", "fastapi", "node", "express", "mongodb", "docker"]:
            if kw in text_lower:
                skills.append(kw.title() if kw != "sql" and kw != "html" and kw != "css" else kw.upper())
        if not skills:
            skills = ["Python", "JavaScript", "React", "SQL", "Git"]

        return {
            "detected_skills": list(set(skills)),
            "education": ["Extracted degree/education credentials from PDF text"],
            "projects": ["Extracted technical project implementations"],
            "experience": ["Extracted professional internship / project experience"],
            "strengths": [
                f"Strong alignment with modern {role} skill requirements",
                "Clear project descriptions and technical tool usage",
                "Solid foundational knowledge shown in resume"
            ],
            "areas_for_improvement": [
                "Quantify achievements with impact metrics (e.g., improved speed by 30%)",
                "Highlight specific problem-solving methodologies used",
                "Group technical skills systematically into backend, frontend, and database categories"
            ],
            "suggestions": [
                "Add live deployment links or GitHub repository links for listed projects",
                "Incorporate industry-standard keywords tailored to target job descriptions",
                "Ensure consistent bullet point layout across all project sections"
            ],
            "possible_interview_questions": [
                f"Walk me through your most challenging project listed in your resume.",
                f"How did you decide on the technology stack for your recent application?",
                f"Explain how you handle state management or backend integration in your projects.",
                f"Describe a situation where you encountered a tough bug and how you resolved it.",
                f"Why are you interested in pursuing a {role} role?"
            ],
            "summary": f"Resume exhibits solid foundation for {role}. Recommendations focus on metrics, project links, and key technical highlights.",
            "is_mock_response": True
        }

    def _fallback_questions(self, role: str, type_: str, diff: str, count: int, topics: list) -> dict:
        tech_q_bank = [
            ("What is the difference between synchronous and asynchronous execution in web applications?", "Web Development", ["Think about event loop and non-blocking I/O", "Consider user responsiveness"]),
            ("Explain the concept of RESTful API design and common HTTP methods.", "Web Architecture", ["Mention GET, POST, PUT, DELETE", "Focus on resource-oriented URIs"]),
            ("What is the difference between SQL and NoSQL databases? When would you choose one over the other?", "DBMS", ["Discuss ACID compliance vs horizontal scalability", "Compare relational tables vs JSON documents"]),
            ("Explain how Object-Oriented Programming (OOP) principles apply in project architecture.", "Software Design", ["Encapsulation, Inheritance, Polymorphism, Abstraction", "Provide a real-world code example"]),
            ("What is Time Complexity and Space Complexity? Explain Big-O notation with an example.", "Data Structures", ["Compare O(1), O(n), and O(n log n)", "Analyze array lookup vs nested loop search"]),
            ("How does process management and thread context switching work in operating systems?", "Operating Systems", ["Distinguish between processes and threads", "Consider CPU register swapping overhead"]),
            ("What is deadlock in concurrency and how can it be prevented?", "Operating Systems", ["Mutual exclusion, hold and wait, no preemption, circular wait", "Mention resource ordering"]),
            ("How do indexes work in relational databases to speed up queries?", "DBMS", ["B-Trees and Hash indexes", "Trade-off between read speed and write performance"])
        ]
        hr_q_bank = [
            ("Tell me about yourself and why you are interested in this position.", "Behavioral", ["Keep it structured: Past, Present, Future", "Highlight relevant skills and passion"]),
            ("Describe a time when you had to work under a tight deadline or high pressure.", "Situation", ["Use the STAR method (Situation, Task, Action, Result)", "Focus on your positive problem-solving strategy"]),
            ("How do you handle conflict or differing opinions within a project team?", "Teamwork", ["Emphasize active listening and constructive collaboration", "Share a specific positive resolution"]),
            ("What is your greatest technical strength, and what is one area you are working to improve?", "Self-Awareness", ["Be genuine and demonstrate continuous learning", "Show steps taken to improve weakness"]),
            ("Where do you see yourself professionally in 3 to 5 years?", "Career Goals", ["Align your growth ambitions with continuous skill development", "Demonstrate commitment to impact"])
        ]

        pool = tech_q_bank if type_ == "Technical" else hr_q_bank if type_ == "HR" else tech_q_bank + hr_q_bank
        questions = []
        for i in range(min(count, len(pool))):
            q, cat, hints = pool[i % len(pool)]
            questions.append({
                "id": i + 1,
                "question": q,
                "category": cat,
                "difficulty": diff,
                "hints": hints
            })

        return {
            "target_role": role,
            "interview_type": type_,
            "difficulty": diff,
            "questions": questions,
            "is_mock_response": True
        }

    def _fallback_evaluation(self, question: str, answer: str, target_role: str, interview_type: str, topic: str = "General") -> dict:
        answer_text = (answer or "").strip()
        question_text = (question or "").lower()
        answer_lower = answer_text.lower()

        if not answer_text:
            return {
                "score": 10,
                "verdict": "Incorrect",
                "what_was_correct": [],
                "what_was_wrong": ["The response was blank. No answer was provided to evaluate."],
                "missing_concepts": ["Provide a direct answer, relevant details, and one concrete example or explanation."],
                "explanation": "The answer did not contain any content, so it could not demonstrate understanding of the question or the required concepts.",
                "improved_answer": "A good answer should clearly explain the concept, connect it to the question, and provide a concise example or tradeoff when relevant.",
                "is_mock_response": True
            }

        if "i don't know" in answer_lower or "not sure" in answer_lower or "do not know" in answer_lower:
            score = 18
            verdict = "Incorrect"
            what_was_correct = []
            what_was_wrong = ["The response does not demonstrate understanding of the concept or question requirements."]
            missing_concepts = ["Explain the core idea clearly, mention at least one relevant principle, and give a practical example where appropriate."]
            explanation = "The answer acknowledges uncertainty rather than demonstrating knowledge, so it does not satisfy the expected depth or correctness for the question."
            improved_answer = "This concept is about [core idea]. It matters because [reason], and a practical example is [example]."
            return {
                "score": score,
                "verdict": verdict,
                "what_was_correct": what_was_correct,
                "what_was_wrong": what_was_wrong,
                "missing_concepts": missing_concepts,
                "explanation": explanation,
                "improved_answer": improved_answer,
                "is_mock_response": True
            }

        if "normaliz" in question_text and ("redundancy" in answer_lower or "integrity" in answer_lower or "functional dependency" in answer_lower or "normal form" in answer_lower):
            score = 86
            verdict = "Mostly Correct"
            what_was_correct = ["The answer captures the core purpose of normalization in reducing redundancy and improving data integrity."]
            what_was_wrong = []
            missing_concepts = ["Consider mentioning normal forms or functional dependencies when the question expects deeper technical detail."]
            explanation = "The response identifies the main goal of normalization correctly, but it could be stronger if it included the structural database concepts that make the explanation more complete."
            improved_answer = "Normalization is the process of organizing tables to reduce redundancy and improve data integrity by splitting data into logical tables and ensuring relationships through keys and normal forms."
            return {
                "score": score,
                "verdict": verdict,
                "what_was_correct": what_was_correct,
                "what_was_wrong": what_was_wrong,
                "missing_concepts": missing_concepts,
                "explanation": explanation,
                "improved_answer": improved_answer,
                "is_mock_response": True
            }

        if "normaliz" in question_text and ("source code" in answer_lower or "machine code" in answer_lower or "compile" in answer_lower):
            score = 14
            verdict = "Incorrect"
            what_was_correct = []
            what_was_wrong = ["The answer confuses database normalization with software compilation or code generation."]
            missing_concepts = ["Explain database normalization in terms of redundancy, integrity, and table design instead of source-code transformation."]
            explanation = "The answer is conceptually incorrect in the DBMS context; normalization is about organizing data, not transforming source code into executable instructions."
            improved_answer = "Normalization is the process of organizing database tables to remove redundancy and preserve data integrity by structuring data according to logical rules and normal forms."
            return {
                "score": score,
                "verdict": verdict,
                "what_was_correct": what_was_correct,
                "what_was_wrong": what_was_wrong,
                "missing_concepts": missing_concepts,
                "explanation": explanation,
                "improved_answer": improved_answer,
                "is_mock_response": True
            }

        word_count = len(answer_text.split())
        technical_keywords = [
            "database", "api", "system", "complexity", "index", "tradeoff", "architecture",
            "thread", "async", "sql", "normalization", "scalability", "performance", "design"
        ]
        matched_keywords = [kw for kw in technical_keywords if kw in answer_lower]

        if word_count >= 60 and matched_keywords:
            score = 78
            verdict = "Mostly Correct"
            what_was_correct = ["The answer provides a relevant explanation and includes domain-specific terminology."]
            what_was_wrong = []
            missing_concepts = ["A more complete answer would include a concrete example or a deeper explanation of tradeoffs and edge cases."]
            explanation = "The response covers the main idea and uses relevant technical language, but it could be more complete by adding a concrete example or deeper reasoning."
            improved_answer = "A stronger answer would define the concept clearly, explain the technical tradeoffs, and include a brief real-world example tied to the question."
            return {
                "score": score,
                "verdict": verdict,
                "what_was_correct": what_was_correct,
                "what_was_wrong": what_was_wrong,
                "missing_concepts": missing_concepts,
                "explanation": explanation,
                "improved_answer": improved_answer,
                "is_mock_response": True
            }

        score = 55 if word_count > 25 else 38
        verdict = "Partially Correct" if score >= 40 else "Incorrect"
        what_was_correct = ["The response shows some awareness of the topic and attempts to answer the question."] if score >= 40 else []
        what_was_wrong = ["The answer is too brief or lacks sufficient detail to fully address the prompt."]
        missing_concepts = ["Include the core concept, at least one key supporting fact, and a short example or explanation of why it matters."]
        explanation = "The answer touches on the topic but does not provide enough depth, clarity, or supporting details to be considered a strong interview response."
        improved_answer = "A stronger answer would define the concept, explain why it matters, and give a concrete example relevant to the question."

        return {
            "score": score,
            "verdict": verdict,
            "what_was_correct": what_was_correct,
            "what_was_wrong": what_was_wrong,
            "missing_concepts": missing_concepts,
            "explanation": explanation,
            "improved_answer": improved_answer,
            "is_mock_response": True
        }

    def _fallback_study_plan(self, role: str, weak_topics: list) -> dict:
        return {
            "target_role": role,
            "recommended_topics": weak_topics if weak_topics else ["Data Structures & Algorithms", "System Architecture", "DBMS Query Optimization", "Behavioral Interview Structure"],
            "daily_goals": [
                {
                    "day": "Day 1",
                    "focus": "Core Data Structures & Complexity Analysis",
                    "tasks": ["Revise Arrays, HashMaps, and Linked Lists", "Solve 3 medium LeetCode/HackerRank problems", "Review Big-O time and space complexity"]
                },
                {
                    "day": "Day 2",
                    "focus": "Database Systems & SQL Optimization",
                    "tasks": ["Practice complex SQL joins and aggregation queries", "Study database indexing and normalization", "Understand ACID properties and transactions"]
                },
                {
                    "day": "Day 3",
                    "focus": "System Design & Web Architecture",
                    "tasks": ["Study REST API best practices and HTTP status codes", "Understand caching, load balancing, and scaling strategies", "Diagram a basic scalable web application architecture"]
                },
                {
                    "day": "Day 4",
                    "focus": "Operating Systems & Networking Concepts",
                    "tasks": ["Review process vs thread execution models", "Study TCP/IP stack vs OSI layers", "Practice explaining deadlock handling principles"]
                },
                {
                    "day": "Day 5",
                    "focus": "HR & Behavioral Question Mastery",
                    "tasks": ["Prepare 3 stories using the STAR method", "Practice answering 'Tell me about yourself' out loud", "Conduct a full mock interview session on Skillix"]
                }
            ],
            "practice_questions": [
                "Implement a LRU Cache and explain its lookup/insertion time complexity.",
                "Write a query to find the second highest salary from an Employee table without subqueries.",
                "Describe how you would handle a database deadlock in a high-concurrency e-commerce app.",
                "How do you prioritize features when given tight, conflicting deadlines?"
            ],
            "suggested_revision_activities": [
                "Record yourself answering 2 technical questions and review clarity and pacing.",
                "Refactor an existing personal project to apply clean code principles and write unit tests.",
                "Build a 1-page summary cheat sheet of essential SQL commands and data structure time complexities."
            ],
            "is_mock_response": True
        }

gemini_service = GeminiService()
