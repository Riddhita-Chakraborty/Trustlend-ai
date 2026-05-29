"""
llm_service.py
--------------
Gemini-powered loan analysis with RAG context injection.
Now returns kb_citations alongside the analysis JSON.

Place at: trustlend-backend/app/services/llm_service.py
"""

import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

try:
    from app.services.rag_service import retrieve_with_citations
    RAG_ENABLED = True
except Exception:
    RAG_ENABLED = False


def analyze_loan_terms(text):
    """
    Analyse loan document text with Gemini + RAG grounding.
    Returns the standard analysis dict PLUS a 'kb_citations' key.
    """
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')

        # -- RAG retrieval --------------------------------------------------
        rag_context = ""
        citations   = []
        if RAG_ENABLED:
            rag_context, citations = retrieve_with_citations(text, k=8)

        # -- Prompt ----------------------------------------------------------
        if rag_context:
            rag_section = f"""
REGULATORY REFERENCE CONTEXT
=============================
The following excerpts come from the RBI Fair Practices Code, RBI Penal Charges
Circular (2023), KFS Guidelines (2024), Indian interest-rate benchmarks, and a
predatory-clause glossary. Use these as your primary reference.

{rag_context}

END OF REGULATORY CONTEXT
===========================
"""
        else:
            rag_section = ""

        prompt = f"""
You are an expert financial-legal analyst specialising in Indian lending regulations.
Analyse the loan document below and return structured JSON.

{rag_section}
INSTRUCTIONS
------------
1. Use the regulatory context to check RBI compliance; cite specific rules.
2. Compare the interest rate to Indian benchmarks:
   personal loan fair <= 14%, home loan <= 10%, general <= 15%.
3. Flag old-style penal interest added to rate (non-compliant post Jan 2024).
4. Check whether a KFS / APR disclosure is present (mandatory from Oct 2024).
5. Flag risky clauses: mandatory arbitration, rights waiver, no-benchmark
   floating rates, unilateral acceleration, cross-default, balloon payments.
6. For EVERY finding in risky_terms, penalty_clauses, hidden_charges_details,
   and rbi_compliance_issues — add a short "KB ref:" suffix indicating which
   RBI rule or glossary entry supports the finding.
   Example: "Penal interest added to rate [KB ref: RBI Penal Charges Circular Aug 2023]"
7. Output ONLY valid JSON. No markdown, no backticks.

JSON STRUCTURE (use null when a field cannot be found):
{{
    "interest_rate": float,
    "loan_amount": float,
    "tenure_months": int,
    "hidden_charges_detected": bool,
    "hidden_charges_details": [string],
    "penalty_clauses": [string],
    "risky_terms": [string],
    "rbi_compliance_issues": [string],
    "summary": string
}}

- hidden_charges_details : list of specific charges that appear excessive or undisclosed
- penalty_clauses        : penalty/penal charge clauses with brief description + KB ref
- risky_terms            : contractual clauses that disadvantage the borrower + KB ref
- rbi_compliance_issues  : specific RBI guideline violations + KB ref
- summary                : 3-4 sentence plain-English summary for a non-expert borrower

LOAN DOCUMENT TEXT:
{text[:30000]}
"""

        response  = model.generate_content(prompt)
        json_text = response.text.strip()
        for fence in ("```json", "```"):
            if json_text.startswith(fence):
                json_text = json_text[len(fence):]
        if json_text.endswith("```"):
            json_text = json_text[:-3]

        result = json.loads(json_text.strip())
        result.setdefault("rbi_compliance_issues", [])

        # Attach the KB citations the RAG layer retrieved
        result["kb_citations"] = citations

        return result

    except Exception as e:
        print(f"LLM Analysis Error: {e}")

        if "safety" in str(e).lower() or "blocked" in str(e).lower():
            return {"error": "The document content triggered safety filters.", "details": str(e)}

        return {
            "interest_rate": 0.0,
            "loan_amount": 0.0,
            "tenure_months": 0,
            "hidden_charges_detected": False,
            "hidden_charges_details": [],
            "penalty_clauses": [],
            "risky_terms": ["AI Analysis Failed - System unavailable"],
            "rbi_compliance_issues": [],
            "kb_citations": [],
            "summary": f"Could not analyse document: {e}. Please try again.",
            "fallback": True,
        }