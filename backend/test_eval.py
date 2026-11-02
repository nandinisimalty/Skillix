import os
import sys
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.gemini_service import gemini_service

print("Testing gemini_service.evaluate_answer directly...")
eval_res = gemini_service.evaluate_answer(
    target_role="Software Engineer",
    interview_type="Technical",
    question="What is the difference between synchronous and asynchronous code execution?",
    user_answer="Synchronous code executes sequentially where each task waits for the previous one to finish, blocking the main thread. Asynchronous code allows operations like I/O and network requests to run in the background without blocking, continuing execution via event loops, promises, or callbacks."
)

print("Score:", eval_res.get("score"))
print("Verdict:", eval_res.get("verdict"))
print("Explanation:", eval_res.get("explanation"))
print("What was correct:", eval_res.get("what_was_correct"))
print("Missing concepts:", eval_res.get("missing_concepts"))
print("is_mock_response:", eval_res.get("is_mock_response"))
