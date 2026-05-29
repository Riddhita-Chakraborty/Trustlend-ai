"""
compare.py
----------
Backend route for loan comparison mode.
Accepts two uploaded files, runs both through the full pipeline
(OCR → LLM → Fairness), and returns a structured comparison response.

Place at: trustlend-backend/app/routes/compare.py
Register in: trustlend-backend/app/__init__.py
"""

from flask import Blueprint, request, current_app
from app.utils.response import success_response, error_response
from app.utils.file_utils import save_upload
from app.services import ocr_service, llm_service, fairness_service

compare_bp = Blueprint('compare', __name__)


def _analyze_one(file):
    """
    Run the full pipeline on a single uploaded file.
    Returns (result_dict, error_string).  One of them will be None.
    """
    filepath, filename = save_upload(file)
    if not filepath:
        return None, "File type not allowed or save failed."

    try:
        text = ocr_service.extract_text(filepath)
        if not text or len(text) < 10:
            return None, "Could not extract text. Ensure the document is a clear PDF or image."

        analysis = llm_service.analyze_loan_terms(text)
        if "error" in analysis:
            return None, analysis["error"]

        fairness = fairness_service.calculate_fairness(analysis)

        return {
            "filename": filename,
            "analysis": analysis,
            "fairness":  fairness,
        }, None

    except Exception as e:
        current_app.logger.error(f"Comparison analysis error for {file.filename}: {e}")
        return None, str(e)


@compare_bp.route('/compare', methods=['POST'])
def compare_documents():
    """
    POST /api/compare
    Form fields: file_a, file_b
    Returns:
    {
        "loan_a": { filename, analysis, fairness },
        "loan_b": { filename, analysis, fairness },
        "verdict": {
            "winner":          "A" | "B" | "tie",
            "winner_label":    "<filename of winner>",
            "score_diff":      <int>,
            "key_differences": [ "<plain-English sentence>", ... ]
        }
    }
    """
    if 'file_a' not in request.files or 'file_b' not in request.files:
        return error_response("Both file_a and file_b are required.", 400)

    file_a = request.files['file_a']
    file_b = request.files['file_b']

    if file_a.filename == '' or file_b.filename == '':
        return error_response("Both files must be selected.", 400)

    # -- Analyse both documents (sequentially; swap to threads if latency matters)
    result_a, err_a = _analyze_one(file_a)
    if err_a:
        return error_response(f"Error analysing Loan A: {err_a}", 500)

    result_b, err_b = _analyze_one(file_b)
    if err_b:
        return error_response(f"Error analysing Loan B: {err_b}", 500)

    # -- Build verdict
    verdict = _build_verdict(result_a, result_b)

    return success_response(
        {
            "loan_a":  result_a,
            "loan_b":  result_b,
            "verdict": verdict,
        },
        "Comparison complete."
    )


# ── Verdict logic ─────────────────────────────────────────────────────────────

def _build_verdict(a, b):
    score_a = a["fairness"]["score"]
    score_b = b["fairness"]["score"]
    diff    = abs(score_a - score_b)

    if diff <= 3:
        winner       = "tie"
        winner_label = "Both loans are roughly equal"
    elif score_a > score_b:
        winner       = "A"
        winner_label = a["filename"]
    else:
        winner       = "B"
        winner_label = b["filename"]

    key_differences = _diff_sentences(a, b)

    return {
        "winner":          winner,
        "winner_label":    winner_label,
        "score_diff":      diff,
        "key_differences": key_differences,
    }


def _diff_sentences(a, b):
    """
    Produce up to 5 plain-English sentences comparing the two loans.
    Each sentence is prefixed with "A", "B", or "=" to indicate which is better.
    """
    sentences = []
    an = a["analysis"]
    bn = b["analysis"]

    # Interest rate
    ir_a = an.get("interest_rate")
    ir_b = bn.get("interest_rate")
    if ir_a and ir_b:
        if abs(ir_a - ir_b) >= 0.5:
            better = "A" if ir_a < ir_b else "B"
            sentences.append(
                f"[{better}] Loan {better} has a lower interest rate "
                f"({ir_a}% vs {ir_b}%)."
            )
        else:
            sentences.append(f"[=] Both loans have similar interest rates (~{ir_a}%).")

    # Hidden charges
    hc_a = an.get("hidden_charges_detected", False)
    hc_b = bn.get("hidden_charges_detected", False)
    if hc_a != hc_b:
        better = "B" if hc_a else "A"
        sentences.append(
            f"[{better}] Loan {better} has no hidden charges detected, "
            f"while the other does."
        )
    elif hc_a and hc_b:
        sentences.append("[=] Both loans have hidden or excessive charges.")

    # Risky terms count
    rt_a = len(an.get("risky_terms", []))
    rt_b = len(bn.get("risky_terms", []))
    if rt_a != rt_b:
        better = "A" if rt_a < rt_b else "B"
        sentences.append(
            f"[{better}] Loan {better} has fewer risky clauses "
            f"({rt_a} vs {rt_b})."
        )

    # Penalty clauses count
    pc_a = len(an.get("penalty_clauses", []))
    pc_b = len(bn.get("penalty_clauses", []))
    if pc_a != pc_b:
        better = "A" if pc_a < pc_b else "B"
        sentences.append(
            f"[{better}] Loan {better} has fewer penalty clauses "
            f"({pc_a} vs {pc_b})."
        )

    # RBI compliance issues
    rbi_a = len(an.get("rbi_compliance_issues", []))
    rbi_b = len(bn.get("rbi_compliance_issues", []))
    if rbi_a != rbi_b:
        better = "A" if rbi_a < rbi_b else "B"
        sentences.append(
            f"[{better}] Loan {better} has fewer RBI compliance violations "
            f"({rbi_a} vs {rbi_b})."
        )

    # Tenure
    t_a = an.get("tenure_months")
    t_b = bn.get("tenure_months")
    if t_a and t_b and abs(t_a - t_b) >= 3:
        sentences.append(
            f"[=] Loan A has a {t_a}-month tenure vs {t_b} months for Loan B."
        )

    return sentences[:5]