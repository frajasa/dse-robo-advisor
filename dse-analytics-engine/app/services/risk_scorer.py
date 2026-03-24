def score_risk_profile(
    monthly_income: float,
    capital_available: float,
    investment_horizon: int,
    primary_goal: str,
    age: int | None = None,
) -> dict:
    """Score an investor's risk profile and recommend a risk tolerance level.

    Returns a risk score (0-100) and recommended tolerance.
    """
    score = 50.0  # Start at moderate

    # Income-to-capital ratio
    if monthly_income > 0:
        months_of_income = capital_available / monthly_income
        if months_of_income > 24:
            score += 10  # Can afford more risk
        elif months_of_income < 6:
            score -= 15  # Limited buffer

    # Investment horizon
    if investment_horizon >= 15:
        score += 15
    elif investment_horizon >= 7:
        score += 5
    elif investment_horizon <= 3:
        score -= 20

    # Goal-based adjustment
    goal_adjustments = {
        "retirement": -5,
        "education": -10,
        "wealth": 10,
        "income": -5,
        "growth": 15,
    }
    score += goal_adjustments.get(primary_goal.lower(), 0)

    # Age adjustment
    if age is not None:
        if age < 30:
            score += 10
        elif age > 55:
            score -= 15
        elif age > 45:
            score -= 5

    # Clamp score
    score = max(0, min(100, score))

    # Map to tolerance
    if score >= 65:
        tolerance = "aggressive"
    elif score >= 35:
        tolerance = "moderate"
    else:
        tolerance = "conservative"

    return {
        "risk_score": round(score, 1),
        "recommended_tolerance": tolerance,
        "factors": {
            "income_buffer": "high" if monthly_income > 0 and capital_available / monthly_income > 12 else "low",
            "time_horizon": "long" if investment_horizon >= 10 else "short" if investment_horizon <= 3 else "medium",
            "goal_type": primary_goal.lower(),
        },
    }
