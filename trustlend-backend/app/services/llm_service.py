import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

def analyze_loan_terms(text):
    """
    Analyzes loan document text using Gemini API to extract key terms and risks.
    """
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""
        You are an expert financial legal analyst. Your task is to analyze the following loan document text and extract key information in a structured JSON format.
        
        Strictly output valid JSON. Do not include markdown formatting like ```json ... ```.

        Analyze the text for:
        1. Interest Rate (annual percentage)
        2. Loan Amount
        3. Tenure (in months)
        4. Hidden Charges (processing fees, insurance, etc. that seem excessive or hidden). Set boolean true/false.
        5. Penalty Clauses (late fees, prepayment penalties). List them as strings.
        6. Risky Terms (arbitration clauses, waiver of rights, dynamic interest rates). List them as strings.
        7. Brief Summary of the loan.

        JSON Structure:
        {{
            "interest_rate": float (e.g., 12.5),
            "loan_amount": float,
            "tenure_months": int,
            "hidden_charges_detected": bool,
            "hidden_charges_details": [string],
            "penalty_clauses": [string],
            "risky_terms": [string],
            "summary": string
        }}

        If a field cannot be found, use null.
        
        Document Text:
        {text[:30000]}  # Truncate to avoid context limit if necessary, though 1.5 flash has large window
        """

        response = model.generate_content(prompt)
        
        # Clean response text to ensure it's valid JSON
        json_text = response.text.strip()
        if json_text.startswith("```json"):
            json_text = json_text[7:]
        if json_text.endswith("```"):
            json_text = json_text[:-3]
            
        return json.loads(json_text)

    except Exception as e:
        print(f"LLM Analysis Error: {str(e)}")
        # Check if it's a safety block
        if "safety" in str(e).lower() or "blocked" in str(e).lower():
             return {
                "error": "The document content triggered safety filters.",
                "details": str(e)
             }
        
        # Fallback for other errors (e.g. Quota, 404, etc)
        print("Using Fallback Analysis due to API Error")
        return {
            "interest_rate": 0.0,
            "loan_amount": 0.0,
            "tenure_months": 0,
            "hidden_charges_detected": False,
            "hidden_charges_details": [],
            "penalty_clauses": [],
            "risky_terms": ["AI Analysis Failed - System unavailable"],
            "summary": f"Could not analyze document due to AI service error: {str(e)}. Please try again later.",
            "fallback": True
        }
