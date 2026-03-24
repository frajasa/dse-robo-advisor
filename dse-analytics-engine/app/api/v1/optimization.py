from fastapi import APIRouter, HTTPException

from app.core import dse_data
from app.models.schemas import OptimizationRequest, OptimizationResponse
from app.services.optimizer import optimize_portfolio

router = APIRouter(prefix="/api/v1", tags=["optimization"])


@router.post("/optimize", response_model=OptimizationResponse)
async def run_optimization(request: OptimizationRequest) -> OptimizationResponse:
    """Run portfolio optimization based on risk tolerance and investment amount.

    Accepts a risk tolerance level (conservative, moderate, aggressive),
    an investment amount in TZS, and an optional primary goal.
    Returns an optimized portfolio with holdings, expected metrics, and rationale.
    """
    valid_tolerances = ["conservative", "moderate", "aggressive"]
    if request.risk_tolerance.lower() not in valid_tolerances:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid risk_tolerance. Must be one of: {valid_tolerances}",
        )

    try:
        result = optimize_portfolio(
            risk_tolerance=request.risk_tolerance,
            investment_amount=request.investment_amount,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Optimization failed: {str(e)}",
        )

    return result


@router.get("/stocks")
async def list_stocks() -> list[dict]:
    """Return the list of available DSE stocks with their fundamental data."""
    stocks = []
    for symbol, data in dse_data.DSE_STOCKS.items():
        stocks.append({
            "symbol": symbol,
            "name": data["name"],
            "expected_return": data["expected_return"],
            "volatility": data["volatility"],
            "dividend_yield": data["dividend_yield"],
            "sector": data["sector"],
        })
    return stocks
