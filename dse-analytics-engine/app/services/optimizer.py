"""Modern Portfolio Theory optimizer with profile-driven constraints and market regime awareness."""

import logging

import numpy as np
from scipy.optimize import minimize

from app.core.config import settings
from app.core import dse_data
from app.models.schemas import HoldingResult, OptimizationResponse
from app.services.market_regime import detect_regime, apply_regime_adjustments

logger = logging.getLogger("dse.optimizer")

# Base risk constraints (adjusted dynamically by horizon, goal, and market regime)
BASE_CONSTRAINTS = {
    "conservative": {"max_equity": 0.65, "min_bonds": 0.15, "max_single": 0.30},
    "moderate":     {"max_equity": 0.85, "min_bonds": 0.10, "max_single": 0.30},
    "aggressive":   {"max_equity": 1.00, "min_bonds": 0.00, "max_single": 0.35},
}

RISK_FREE_RATE = settings.RISK_FREE_RATE


# ---------------------------------------------------------------------------
# Dynamic constraint builder
# ---------------------------------------------------------------------------

def _get_dynamic_constraints(
    risk_tolerance: str,
    horizon: int | None = None,
    goal: str | None = None,
) -> dict:
    """Build portfolio constraints adjusted for investment horizon and goal.

    This is where the user's full profile actually affects the portfolio.
    """
    c = dict(BASE_CONSTRAINTS[risk_tolerance])

    # --- Horizon adjustments ---
    if horizon is not None:
        if horizon >= 15:
            # Long horizon: can tolerate more equity risk
            c["max_equity"] = min(1.0, c["max_equity"] + 0.10)
            c["min_bonds"] = max(0.0, c["min_bonds"] - 0.05)
        elif horizon >= 10:
            c["max_equity"] = min(1.0, c["max_equity"] + 0.05)
        elif horizon <= 3:
            # Very short horizon: preserve capital
            c["max_equity"] = max(0.30, c["max_equity"] - 0.15)
            c["min_bonds"] = min(0.50, c["min_bonds"] + 0.10)
            c["max_single"] = min(c["max_single"], 0.25)
        elif horizon <= 5:
            c["max_equity"] = max(0.40, c["max_equity"] - 0.10)
            c["min_bonds"] = min(0.40, c["min_bonds"] + 0.05)

    # --- Goal adjustments ---
    if goal:
        goal_lower = goal.lower()
        if goal_lower == "income":
            # Income goal: favor dividend-paying stocks, more bonds
            c["min_bonds"] = max(c["min_bonds"], 0.15)
            c["min_dividend_yield"] = 0.04  # portfolio-level minimum
        elif goal_lower == "retirement":
            if horizon is not None and horizon <= 5:
                # Near-retirement: very conservative override
                c["max_equity"] = min(c["max_equity"], 0.40)
                c["min_bonds"] = max(c["min_bonds"], 0.30)
            elif horizon is not None and horizon <= 10:
                c["max_equity"] = min(c["max_equity"], 0.60)
                c["min_bonds"] = max(c["min_bonds"], 0.20)
        elif goal_lower == "education":
            # Education: moderate, lower concentration
            c["max_single"] = min(c["max_single"], 0.20)
        elif goal_lower in ("wealth", "growth"):
            # Growth: slightly more aggressive
            c["max_equity"] = min(1.0, c["max_equity"] + 0.05)

    return c


# ---------------------------------------------------------------------------
# Core math
# ---------------------------------------------------------------------------

def _get_bond_index() -> int | None:
    try:
        return dse_data.STOCK_SYMBOLS.index("GOVB")
    except ValueError:
        return None


def _portfolio_return(weights: np.ndarray, expected_returns: np.ndarray) -> float:
    return float(np.dot(weights, expected_returns))


def _portfolio_volatility(weights: np.ndarray, cov_matrix: np.ndarray) -> float:
    return float(np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights))))


def _negative_sharpe_ratio(
    weights: np.ndarray,
    expected_returns: np.ndarray,
    cov_matrix: np.ndarray,
    risk_free_rate: float,
) -> float:
    port_return = _portfolio_return(weights, expected_returns)
    port_vol = _portfolio_volatility(weights, cov_matrix)
    if port_vol == 0:
        return 0.0
    return -(port_return - risk_free_rate) / port_vol


# ---------------------------------------------------------------------------
# Rationale generator
# ---------------------------------------------------------------------------

def _generate_rationale(symbol: str, weight: float, risk_tolerance: str, regime: str | None = None) -> str:
    stock = dse_data.DSE_STOCKS[symbol]
    sector = stock["sector"]
    div_yield = stock["dividend_yield"]
    expected_ret = stock["expected_return"]
    pct = round(weight * 100, 1)

    regime_note = ""
    if regime and regime != "NORMAL":
        regime_note = f" (adjusted for {regime.lower().replace('_', ' ')} market conditions)"

    if sector == "FixedIncome":
        return (
            f"Government bonds at {pct}% provide stability with {div_yield:.1%} yield "
            f"and minimal volatility — a defensive anchor for the {risk_tolerance} profile{regime_note}."
        )
    if sector == "Banking":
        return (
            f"{stock['name']} at {pct}% offers {expected_ret:.0%} expected return "
            f"with {div_yield:.1%} dividend yield. Core exposure to Tanzania's financial sector{regime_note}."
        )
    if sector == "Telecom":
        return (
            f"{stock['name']} at {pct}% diversifies into telecoms with {expected_ret:.0%} return "
            f"and {div_yield:.1%} yield, benefiting from Tanzania's mobile growth{regime_note}."
        )
    if sector == "Consumer":
        return (
            f"{stock['name']} at {pct}% adds defensive consumer exposure with {expected_ret:.0%} return "
            f"and {div_yield:.1%} dividend yield{regime_note}."
        )
    if sector == "Insurance":
        return (
            f"{stock['name']} at {pct}% provides insurance diversification with {div_yield:.1%} "
            f"dividend yield for income generation{regime_note}."
        )
    return (
        f"{stock['name']} at {pct}% contributes diversification with "
        f"{expected_ret:.0%} expected return and {div_yield:.1%} yield{regime_note}."
    )


# ---------------------------------------------------------------------------
# Main optimizer
# ---------------------------------------------------------------------------

def optimize_portfolio(
    risk_tolerance: str,
    investment_amount: float,
    investment_horizon: int | None = None,
    primary_goal: str | None = None,
) -> OptimizationResponse:
    """Run MPT optimization with profile-driven constraints and market regime awareness."""

    risk_tolerance = risk_tolerance.lower()
    if risk_tolerance not in BASE_CONSTRAINTS:
        raise ValueError(f"Invalid risk_tolerance '{risk_tolerance}'. Must be one of: {list(BASE_CONSTRAINTS.keys())}")

    # Step 1: Build dynamic constraints from profile
    constraints_config = _get_dynamic_constraints(risk_tolerance, investment_horizon, primary_goal)

    # Step 2: Detect market regime and adjust constraints
    regime_info = detect_regime()
    regime = regime_info["regime"]
    regime_desc = regime_info["description"]

    if regime != "NORMAL":
        constraints_config = apply_regime_adjustments(constraints_config, regime_info)
        logger.info("Regime %s applied: %s", regime, regime_desc)

    max_equity = constraints_config["max_equity"]
    min_bonds = constraints_config["min_bonds"]
    max_single = constraints_config["max_single"]
    min_div_yield = constraints_config.get("min_dividend_yield", 0.0)

    # Step 3: Prepare optimization inputs
    n_assets = len(dse_data.STOCK_SYMBOLS)
    expected_returns = dse_data.get_expected_returns()
    cov_matrix = dse_data.get_covariance_matrix()
    bond_index = _get_bond_index()
    equity_indices = [i for i in range(n_assets) if i != bond_index]

    # Dividend yields for income constraint
    div_yields = np.array([
        dse_data.DSE_STOCKS[s]["dividend_yield"] for s in dse_data.STOCK_SYMBOLS
    ])

    # Step 4: Build scipy constraints
    scipy_constraints = [
        {"type": "eq", "fun": lambda w: np.sum(w) - 1.0},
        {"type": "ineq", "fun": lambda w: max_equity - sum(w[i] for i in equity_indices)},
    ]

    if bond_index is not None and min_bonds > 0:
        scipy_constraints.append(
            {"type": "ineq", "fun": lambda w, bi=bond_index: w[bi] - min_bonds},
        )

    # Income goal: portfolio dividend yield must meet minimum
    if min_div_yield > 0:
        scipy_constraints.append(
            {"type": "ineq", "fun": lambda w: float(np.dot(w, div_yields)) - min_div_yield},
        )

    bounds = tuple((0.0, max_single) for _ in range(n_assets))
    w0 = np.array([1.0 / n_assets] * n_assets)

    # Step 5: Optimize
    result = minimize(
        _negative_sharpe_ratio,
        w0,
        args=(expected_returns, cov_matrix, RISK_FREE_RATE),
        method="SLSQP",
        bounds=bounds,
        constraints=scipy_constraints,
        options={"maxiter": 1000, "ftol": 1e-12},
    )

    optimal_weights = np.maximum(result.x, 0.0)
    optimal_weights = optimal_weights / np.sum(optimal_weights)

    # Step 6: Calculate metrics
    port_return = _portfolio_return(optimal_weights, expected_returns)
    port_vol = _portfolio_volatility(optimal_weights, cov_matrix)
    sharpe = (port_return - RISK_FREE_RATE) / port_vol if port_vol > 0 else 0.0

    # Step 7: Build holdings
    holdings: list[HoldingResult] = []
    projected_dividend = 0.0

    for i, symbol in enumerate(dse_data.STOCK_SYMBOLS):
        weight = optimal_weights[i]
        if weight < 0.01:
            continue

        stock = dse_data.DSE_STOCKS[symbol]
        dividend_contribution = weight * stock["dividend_yield"] * investment_amount
        projected_dividend += dividend_contribution

        holdings.append(HoldingResult(
            symbol=symbol,
            name=stock["name"],
            allocation=round(weight * 100, 2),
            dividend_yield=stock["dividend_yield"],
            sector=stock["sector"],
            rationale=_generate_rationale(symbol, weight, risk_tolerance, regime),
        ))

    holdings.sort(key=lambda h: h.allocation, reverse=True)

    regime_adj_text = regime_desc if regime != "NORMAL" else None

    return OptimizationResponse(
        holdings=holdings,
        expected_annual_return=round(port_return, 4),
        expected_volatility=round(port_vol, 4),
        sharpe_ratio=round(sharpe, 4),
        projected_dividend=round(projected_dividend, 2),
        market_regime=regime,
        regime_adjustments=regime_adj_text,
    )
