import os
from dotenv import load_dotenv
from app.services.llm_service import analyze_loan_terms

load_dotenv()

print("Testing LLM Service...")
print(f"API Key present: {bool(os.getenv('GEMINI_API_KEY'))}")

text = "This is a loan agreement. Interest rate is 15%. Processing fee is 2%."
try:
    result = analyze_loan_terms(text)
    print("Success!")
    print(result)
except Exception as e:
    print("Error detected:")
    print(e)
