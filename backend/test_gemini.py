import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

print("Calling gemini-3.5-flash...")
try:
    res = client.models.generate_content(
        model="gemini-3.5-flash",
        contents="Say hello in one word."
    )
    print("res.text:", repr(res.text))
except Exception as e:
    print("Error:", type(e), e)
