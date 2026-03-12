import numpy as np
from scipy.optimize import minimize

from app.core.config import settings
from app.core.dse_data import (
    DSE_STOCKS,
    STOCK_SYMBOLS,
    get_covariance_matrix,
    get_expected_returns,
)
from app.models.schemas import HoldingResult, OptimizationResponse

# Risk-based constraints for portfolio construction
RISK_CONSTRAINTS = {
    "conservative": {
        "max_equity": 0.65,
        "min_bonds": 0.15,
        "max_single": 0.30,
    },
    "moderate": {
        "max_equity": 0.85,
        "min_bonds": 0.10,
        "max_single": 0.30,
    },
    "aggressive": {
        "max_equity": 1.00,
        "min_bonds": 0.00,
        "max_single": 0.35,
    },
}

# Index of the government bond (fixed income) in STOCK_SYMBOLS
BOND_INDEX = STOCK_SYMBOLS.index("GOVB")

RISK_FREE_RATE = settings.RISK_FREE_RATE


def _portfolio_return(weights: np.ndarray, expected_returns: np.ndarray) -> float:
    """Calculate the expected portfolio return."""
    return float(np.dot(weights, expected_returns))


def _portfolio_volatility(weights: np.ndarray, cov_matrix: np.ndarray) -> float:
    """Calculate the expected portfolio volatility (standard deviation)."""
    return float(np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights))))


def _negative_sharpe_ratio(
    weights: np.ndarray,
    expected_returns: np.ndarray,
    cov_matrix: np.ndarray,
    risk_free_rate: float,
) -> float:
    """Objective function: negative Sharpe ratio (we minimize this)."""
    port_return = _portfolio_return(weights, expected_returns)
    port_vol = _portfolio_volatility(weights, cov_matrix)
    if port_vol == 0:
        return 0.0
    sharpe = (port_return - risk_free_rate) / port_vol
    return -sharpe


def _generate_rationale(symbol: str, weight: float, risk_tolerance: str) -> str:
    """Generate a human-readable rationale for including a holding."""
    stock = DSE_STOCKS[symbol]
    sector = stock["sector"]
    div_yield = stock["dividend_yield"]
    expected_ret = stock["expected_return"]
    pct = round(weight * 100, 1)

    if sector == "FixedIncome":
        return (
            f"Government bonds allocated at {pct}% provide portfolio stability "
            f"with {div_yield:.1%} yield and minimal volatility, "
            f"serving as a defensive anchor for the {risk_tolerance} profile."
        )

    if sector == "Banking":
        return (
            f"{stock['name']} allocated at {pct}% offers solid {expected_ret:.0%} "
            f"expected return with {div_yield:.0%} dividend yield. "
            f"Banking stocks provide core portfolio exposure to Tanzania's financial sector."
        )

    if sector == "Telecom":
        return (
            f"{stock['name']} at {pct}% provides telecom sector diversification "
            f"with {expected_ret:.0%} expected return and {div_yield:.1%} dividend yield, "
            f"benefiting from Tanzania's growing mobile penetration."
        )

    if sector == "Consumer":
        return (
            f"{stock['name']} at {pct}% adds consumer sector exposure "
            f"with defensive characteristics, {expected_ret:.0%} expected return, "
            f"and a reliable {div_yield:.0%} dividend yield."
        )

    if sector == "Aviation":
        return (
            f"{stock['name']} at {pct}% offers higher growth potential "
            f"with {expected_ret:.0%} expected return, suitable for the "
            f"{risk_tolerance} risk profile seeking capital appreciation."
        )

    if sector == "Insurance":
        return (
            f"{stock['name']} at {pct}% provides insurance sector diversification "
            f"with {expected_ret:.0%} expected return and a strong {div_yield:.0%} "
            f"dividend yield for income generation."
        )

    return (
        f"{stock['name']} allocated at {pct}% contributes to portfolio diversification "
        f"with {expected_ret:.0%} expected return."
    )


def optimize_portfolio(
    risk_tolerance: str,
    investment_amount: float,
) -> OptimizationResponse:
    """Run MPT portfolio optimization for a given risk tolerance.

    Uses scipy SLSQP optimizer to maximize the Sharpe ratio subject to
    risk-tolerance-based constraints on equity exposure, bond minimums,
    and single-stock concentration limits.
    """
    risk_tolerance = risk_tolerance.lower()
    if risk_tolerance not in RISK_CONSTRAINTS:
        raise ValueError(
            f"Invalid risk_tolerance '{risk_tolerance}'. "
            f"Must be one of: {list(RISK_CONSTRAINTS.keys())}"
        )

    constraints_config = RISK_CONSTRAINTS[risk_tolerance]
    max_equity = constraints_config["max_equity"]
    min_bonds = constraints_config["min_bonds"]
    max_single = constraints_config["max_single"]

    n_assets = len(STOCK_SYMBOLS)
    expected_returns = get_expected_returns()
    cov_matrix = get_covariance_matrix()

    # Identify equity (non-bond) indices
    equity_indices = [i for i in range(n_assets) if i != BOND_INDEX]

    # Constraints for scipy minimize
    constraints = [
        # Weights must sum to 1
        {"type": "eq", "fun": lambda w: np.sum(w) - 1.0},
        # Total equity exposure <= max_equity
        {"type": "ineq", "fun": lambda w: max_equity - sum(w[i] for i in equity_indices)},
        # Bond allocation >= min_bonds
        {"type": "ineq", "fun": lambda w: w[BOND_INDEX] - min_bonds},
    ]

    # Bounds: each weight between 0 and max_single
    bounds = tuple((0.0, max_single) for _ in range(n_assets))

    # Initial guess: equal weights
    w0 = np.array([1.0 / n_assets] * n_assets)

    result = minimize(
        _negative_sharpe_ratio,
        w0,
        args=(expected_returns, cov_matrix, RISK_FREE_RATE),
        method="SLSQP",
        bounds=bounds,
        constraints=constraints,
        options={"maxiter": 1000, "ftol": 1e-12},
    )

    optimal_weights = result.x

    # Clip any tiny negative values from numerical noise
    optimal_weights = np.maximum(optimal_weights, 0.0)
    # Renormalize to ensure weights sum to exactly 1
    optimal_weights = optimal_weights / np.sum(optimal_weights)

    # Calculate portfolio metrics
    port_return = _portfolio_return(optimal_weights, expected_returns)
    port_vol = _portfolio_volatility(optimal_weights, cov_matrix)
    sharpe = (port_return - RISK_FREE_RATE) / port_vol if port_vol > 0 else 0.0

    # Build holdings list, pruning allocations below 1%
    holdings: list[HoldingResult] = []
    projected_dividend = 0.0

    for i, symbol in enumerate(STOCK_SYMBOLS):
        weight = optimal_weights[i]
        if weight < 0.01:
            continue

        stock = DSE_STOCKS[symbol]
        dividend_contribution = weight * stock["dividend_yield"] * investment_amount
        projected_dividend += dividend_contribution

        holdings.append(
            HoldingResult(
                symbol=symbol,
                name=stock["name"],
                allocation=round(weight * 100, 2),
                dividend_yield=stock["dividend_yield"],
                sector=stock["sector"],
                rationale=_generate_rationale(symbol, weight, risk_tolerance),
            )
        )

    # Sort holdings by allocation descending
    holdings.sort(key=lambda h: h.allocation, reverse=True)

    return OptimizationResponse(
        holdings=holdings,
        expected_annual_return=round(port_return, 4),
        expected_volatility=round(port_vol, 4),
        sharpe_ratio=round(sharpe, 4),
        projected_dividend=round(projected_dividend, 2),
    )
