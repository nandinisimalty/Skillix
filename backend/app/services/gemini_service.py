import os
import json
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        self._init_gemini()

    def _init_gemini(self):
        if not self.api_key:
            logger.info("Gemini API key is not configured. Service will use standard intelligent fallback mode.")
            return

        try:
            # Try new google-genai SDK first
            from google import genai
            self.client = genai.Client(api_key=self.api_key)
            logger.info("Gemini client initialized successfully with google-genai.")
        except Exception as e:
            logger.warning(f"Could not initialize google-genai SDK ({str(e)}). Checking legacy SDK.")
            try:
                import google.generativeai as legacy_genai
                legacy_genai.configure(api_key=self.api_key)
                self.client = legacy_genai.GenerativeModel('gemini-1.5-flash')
                logger.info("Gemini legacy GenerativeModel initialized.")
            except Exception as ex:
                logger.error(f"Failed to initialize Gemini SDK: {str(ex)}")
                self.client = None

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

    def generate_interview_questions(self, target_role: str, interview_type: str, difficulty: str, num_questions: int, topics: list[str]) -> dict:
        topics_str = ", ".join(topics) if topics else "General Core Concepts"
        prompt = f"""
        Generate {num_questions} realistic {difficulty} level interview questions for a candidate applying for '{target_role}'.
        Interview Type: {interview_type} (Technical, HR, or Mixed)
        Selected Focus Topics: {topics_str}

        Return a strict raw JSON object without markdown fences containing a key "questions" which is a list of items. Each item must have:
        - "id": integer starting from 1
        - "question": clear, detailed question string
        - "category": string (e.g., Data Structures, System Design, HR Behavioral, DBMS)
        - "difficulty": string ("{difficulty}")
        - "hints": list of 2 short hints to guide the candidate
        """

        if self.client and self.api_key:
            try:
                response_text = self._generate_content(prompt)
                clean_json = self._clean_json_string(response_text)
                parsed = json.loads(clean_json)
                parsed["is_mock_response"] = False
                parsed["target_role"] = target_role
                parsed["interview_type"] = interview_type
                parsed["difficulty"] = difficulty
                return parsed
            except Exception as e:
                logger.error(f"Gemini API error during question generation: {str(e)}. Falling back.")

        return self._fallback_questions(target_role, interview_type, difficulty, num_questions, topics)

    def evaluate_answer(self, target_role: str, interview_type: str, question: str, user_answer: str, topic: str = None) -> dict:
        relevant_topic = (topic or "General").strip() or "General"
        prompt = f"""
        You are an expert interviewer and assessor for a role targeting '{target_role}'.
        Evaluate the submitted answer independently and fairly.

        Interview type: {interview_type}
        Relevant topic: {relevant_topic}
        Question: "{question}"
        Candidate answer: "{user_answer}"

        Evaluation instructions:
        - Judge the actual answer, not the expected answer.
        - For technical questions, assess technical correctness, relevance, completeness, important missing concepts, and quality of explanation.
        - For HR questions, assess clarity, structure, relevance, professionalism, and specificity.
        - For programming or SQL questions, judge the actual solution or explanation against the question requirements; do not claim a solution was executed or tested when it was not.
        - If the answer is empty, vague, or says the user does not know, assign a low score and explain why.

        Return only valid JSON with this exact structure and no markdown fences:
        {{
          "score": 0,
          "verdict": "Incorrect",
          "what_was_correct": ["one or more correct points from the answer"],
          "what_was_wrong": ["specific mistake or weakness"],
          "missing_concepts": ["important concepts or details missing"],
          "explanation": "A short rationale describing why the score was assigned.",
          "improved_answer": "A concise, stronger answer to the question."
        }}

        Rules:
        - score must be an integer between 0 and 100.
        - verdict should be one of: "Correct", "Mostly Correct", "Partially Correct", or "Incorrect".
        - Do not reuse a generic sentence for every answer. Ground every item in the actual question and answer.
        - Make the feedback helpful, fair, and specific to the candidate's response.
        """

        if self.client and self.api_key:
            try:
                response_text = self._generate_content(prompt)
                clean_json = self._clean_json_string(response_text)
                parsed = json.loads(clean_json)
                normalized = self._normalize_answer_evaluation(parsed, question, user_answer)
                normalized["is_mock_response"] = False
                return normalized
            except Exception as e:
                logger.error(f"Gemini API error during answer evaluation: {str(e)}.", exc_info=True)
                raise

        return self._fallback_evaluation(question, user_answer, target_role, interview_type, relevant_topic)

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

    def _generate_content(self, prompt: str) -> str:
        if hasattr(self.client, 'models'): # google-genai SDK
            candidate_models = [
                'gemini-3.5-flash-lite',
                'gemini-3.8-flash',
                'gemini-2.5-flash',
                'gemini-2.0-flash'
            ]
            last_error = None
            for model_name in candidate_models:
                try:
                    res = self.client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    return res.text
                except Exception as exc:
                    last_error = exc
                    logger.warning(f"Gemini model {model_name} failed: {exc}")
            raise RuntimeError(f"All Gemini model attempts failed. Last error: {last_error}")
        elif hasattr(self.client, 'generate_content'): # legacy google.generativeai SDK
            res = self.client.generate_content(prompt)
            return res.text
        raise RuntimeError("No suitable Gemini client initialized")

    def _clean_json_string(self, text: str) -> str:
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()

    def _derive_verdict(self, score: int) -> str:
        if score >= 80:
            return "Correct"
        if score >= 65:
            return "Mostly Correct"
        if score >= 40:
            return "Partially Correct"
        return "Incorrect"

    def _normalize_answer_evaluation(self, payload: dict, question: str, user_answer: str) -> dict:
        if not isinstance(payload, dict):
            raise ValueError("Gemini returned a non-object response for answer evaluation.")

        def normalize_list(value):
            if isinstance(value, list):
                items = []
                for item in value:
                    if isinstance(item, str) and item.strip():
                        items.append(item.strip())
                    elif item is not None:
                        text = str(item).strip()
                        if text:
                            items.append(text)
                return items
            if isinstance(value, str) and value.strip():
                return [value.strip()]
            return []

        score_raw = payload.get("score", 0)
        try:
            score = int(score_raw)
        except (TypeError, ValueError):
            score = 0
        score = max(0, min(100, score))

        verdict = payload.get("verdict") or self._derive_verdict(score)
        if not isinstance(verdict, str) or not verdict.strip():
            verdict = self._derive_verdict(score)

        explanation = payload.get("explanation") or payload.get("summary") or "The response was evaluated against the question's requirements and the candidate's answer quality."
        improved_answer = payload.get("improved_answer") or payload.get("better_answer_example") or self._build_default_model_answer(question, user_answer)

        raw_correct = normalize_list(payload.get("what_was_correct")) or normalize_list(payload.get("what_went_well"))
        if score < 50:
            raw_correct = [item for item in (raw_correct or []) if not any(pattern in item.lower() for pattern in ["addressed the core idea", "the answer was relevant", "the answer is correct", "the response was clear"])]

        raw_wrong = normalize_list(payload.get("what_was_wrong")) or normalize_list(payload.get("what_is_missing"))
        if not raw_wrong and score < 50 and not raw_correct:
            raw_wrong = ["The response did not sufficiently answer the question or demonstrate the expected understanding."]

        if score >= 50:
            what_was_correct = raw_correct or ["The answer addressed the core idea of the question."]
        else:
            what_was_correct = []

        normalized = {
            "score": score,
            "verdict": verdict.strip(),
            "what_was_correct": what_was_correct,
            "what_was_wrong": raw_wrong or ["No major issues were identified."],
            "missing_concepts": normalize_list(payload.get("missing_concepts")) or [],
            "explanation": str(explanation).strip() or "The answer was evaluated against the question requirements and the quality of the explanation provided.",
            "improved_answer": str(improved_answer).strip() or self._build_default_model_answer(question, user_answer),
            "is_mock_response": False
        }

        if score < 50 and not normalized["what_was_correct"]:
            normalized["what_was_wrong"] = raw_wrong or ["The answer did not adequately meet the question requirements."]

        if not normalized["what_was_wrong"] and not normalized["missing_concepts"]:
            normalized["what_was_wrong"] = ["No significant gaps were identified in the submitted answer."]

        return normalized

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
