"""Enhanced risk profiling — considers risk capacity vs. risk willingness.

Risk capacity = financial ability to take risk (income, capital, horizon)
Risk willingness = user's stated preference (conservative/moderate/aggressive)
Final recommendation = the safer of the two.
"""


def score_risk_profile(
    monthly_income: float,
    capital_available: float,
    investment_horizon: int,
    primary_goal: str,
    age: int | None = None,
) -> dict:
    """Score an investor's risk profile with capacity vs. willingness analysis."""

    # --- Risk Capacity Score (financial ability to take risk) ---
    capacity_score = 50.0
    capacity_reasons = []

    # Income buffer
    if monthly_income > 0:
        months_buffer = capital_available / monthly_income
        if months_buffer > 24:
            capacity_score += 12
            capacity_reasons.append("Strong income buffer (>24 months)")
        elif months_buffer > 12:
            capacity_score += 5
            capacity_reasons.append("Adequate income buffer (12-24 months)")
        elif months_buffer < 6:
            capacity_score -= 15
            capacity_reasons.append("Low income buffer (<6 months) — preserve capital")
        elif months_buffer < 3:
            capacity_score -= 25
            capacity_reasons.append("Very low buffer (<3 months) — high financial risk")

    # Investment horizon
    if investment_horizon >= 20:
        capacity_score += 20
        capacity_reasons.append("Very long horizon (20+ years) — can ride out volatility")
    elif investment_horizon >= 15:
        capacity_score += 15
        capacity_reasons.append("Long horizon (15+ years) — can tolerate market cycles")
    elif investment_horizon >= 10:
        capacity_score += 8
        capacity_reasons.append("Medium-long horizon (10+ years)")
    elif investment_horizon >= 5:
        capacity_score += 0
        capacity_reasons.append("Medium horizon (5-10 years)")
    elif investment_horizon <= 2:
        capacity_score -= 25
        capacity_reasons.append("Very short horizon (≤2 years) — capital preservation needed")
    elif investment_horizon <= 3:
        capacity_score -= 15
        capacity_reasons.append("Short horizon (≤3 years) — limited recovery time")

    # Goal
    goal_lower = primary_goal.lower()
    if goal_lower in ("retirement",):
        if investment_horizon and investment_horizon <= 5:
            capacity_score -= 15
            capacity_reasons.append("Near retirement — capital safety critical")
        else:
            capacity_score -= 5
            capacity_reasons.append("Retirement goal — moderate caution")
    elif goal_lower == "education":
        capacity_score -= 10
        capacity_reasons.append("Education goal — fixed deadline, can't delay")
    elif goal_lower in ("wealth", "growth"):
        capacity_score += 10
        capacity_reasons.append("Growth/wealth goal — can accept short-term losses")
    elif goal_lower == "income":
        capacity_score -= 3
        capacity_reasons.append("Income goal — favor stable dividend payers")

    # Age (if provided)
    if age is not None:
        if age < 25:
            capacity_score += 15
            capacity_reasons.append(f"Young investor (age {age}) — decades to recover from losses")
        elif age < 35:
            capacity_score += 10
            capacity_reasons.append(f"Early career (age {age}) — long accumulation phase")
        elif age > 60:
            capacity_score -= 20
            capacity_reasons.append(f"Near/in retirement (age {age}) — preserve capital")
        elif age > 50:
            capacity_score -= 10
            capacity_reasons.append(f"Pre-retirement (age {age}) — reducing risk")
        elif age > 40:
            capacity_score -= 3

    # Interaction effects
    if age is not None and age < 30 and investment_horizon >= 15 and monthly_income > 0 and capital_available / monthly_income > 12:
        capacity_score += 8
        capacity_reasons.append("Young + long horizon + good buffer = strong risk capacity")

    if age is not None and age > 55 and investment_horizon <= 5:
        capacity_score -= 10
        capacity_reasons.append("Older + short horizon = must be conservative")

    # Clamp
    capacity_score = max(0, min(100, capacity_score))

    # Map capacity to tolerance level
    if capacity_score >= 65:
        capacity_tolerance = "aggressive"
    elif capacity_score >= 35:
        capacity_tolerance = "moderate"
    else:
        capacity_tolerance = "conservative"

    # --- Risk Willingness Score (not computed here — user selects directly) ---
    # The user's stated risk_tolerance is their willingness.
    # We return capacity so the frontend/optimizer can use min(capacity, willingness).

    return {
        "risk_score": round(capacity_score, 1),
        "recommended_tolerance": capacity_tolerance,
        "risk_capacity": capacity_tolerance,
        "capacity_score": round(capacity_score, 1),
        "adjustment_reasons": capacity_reasons,
        "factors": {
            "income_buffer": (
                "strong" if monthly_income > 0 and capital_available / monthly_income > 12
                else "adequate" if monthly_income > 0 and capital_available / monthly_income > 6
                else "low"
            ),
            "time_horizon": (
                "very_long" if investment_horizon >= 15
                else "long" if investment_horizon >= 10
                else "medium" if investment_horizon >= 5
                else "short"
            ),
            "goal_type": goal_lower,
            "age_group": (
                "young" if age and age < 30
                else "mid_career" if age and age < 45
                else "pre_retirement" if age and age < 60
                else "retirement" if age
                else "unknown"
            ),
        },
    }
