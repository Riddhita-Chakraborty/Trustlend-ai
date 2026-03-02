def calculate_fairness(analysis_data):
    """
    Calculates a fairness score (0-100) based on the analysis data.
    Returns score, verdict, and breakdown.
    """
    score = 100
    breakdown = []
    
    # Check for fallback/error state first
    if analysis_data.get('fallback', False):
        return {
            "score": 0,
            "verdict": "Error",
            "breakdown": ["Analysis Failed due to API limits. Please try again later."]
        }
    
    # Extract data with defaults
    interest_rate = analysis_data.get('interest_rate')
    hidden_charges = analysis_data.get('hidden_charges_detected', False)
    penalties = analysis_data.get('penalty_clauses', [])
    risks = analysis_data.get('risky_terms', [])
    
    # 1. Interest Rate check
    if interest_rate:
        if interest_rate > 30:
            deduction = 40
            score -= deduction
            breakdown.append(f"Extremely high interest rate ({interest_rate}%): -{deduction}")
        elif interest_rate > 20:
            deduction = 20
            score -= deduction
            breakdown.append(f"High interest rate ({interest_rate}%): -{deduction}")
        elif interest_rate > 15:
            deduction = 10
            score -= deduction
            breakdown.append(f"Moderately high interest rate ({interest_rate}%): -{deduction}")
    
    # 2. Hidden Charges check
    if hidden_charges:
        deduction = 20
        score -= deduction
        breakdown.append(f"Hidden or excessive charges detected: -{deduction}")
        
    # 3. Penalty Clauses check
    if penalties:
        deduction = 5 * len(penalties)
        score -= deduction
        breakdown.append(f"{len(penalties)} penalty clauses found: -{deduction}")
        
    # 4. Risky Terms check
    if risks:
        deduction = 10 * len(risks)
        score -= deduction
        breakdown.append(f"{len(risks)} risky terms found: -{deduction}")
        
    # Cap score at 0
    score = max(0, score)
    
    # Determine Verdict
    if score >= 80:
        verdict = "Fair"
    elif score >= 50:
        verdict = "Needs Review"
    else:
        verdict = "Unfair"
        
    return {
        "score": score,
        "verdict": verdict,
        "breakdown": breakdown
    }
