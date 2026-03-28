from pydantic import BaseModel, Field
from typing import Optional


class OptimizationRequest(BaseModel):
    risk_tolerance: str = Field(
        ...,
        description="Risk tolerance level: 'conservative', 'moderate', or 'aggressive'",
        examples=["moderate"],
    )
    investment_amount: float = Field(
        ...,
        gt=0,
        description="Total investment amount in TZS",
        examples=[10000000.0],
    )
    primary_goal: Optional[str] = Field(
        default=None,
        description="Primary investment goal: 'wealth', 'income', 'retirement', 'education'",
        examples=["wealth"],
    )
    investment_horizon: Optional[int] = Field(
        default=None,
        ge=1,
        le=30,
        description="Investment horizon in years",
        examples=[10],
    )


class HoldingResult(BaseModel):
    symbol: str = Field(..., description="Stock ticker symbol")
    name: str = Field(..., description="Full company name")
    allocation: float = Field(..., description="Portfolio allocation as a percentage (0-100)")
    dividend_yield: float = Field(..., description="Annual dividend yield as a decimal")
    sector: str = Field(..., description="Market sector classification")
    rationale: str = Field(..., description="Explanation for including this holding")


class OptimizationResponse(BaseModel):
    holdings: list[HoldingResult] = Field(..., description="List of portfolio holdings")
    expected_annual_return: float = Field(
        ..., description="Expected annualized portfolio return as a decimal"
    )
    expected_volatility: float = Field(
        ..., description="Expected annualized portfolio volatility as a decimal"
    )
    sharpe_ratio: float = Field(..., description="Portfolio Sharpe ratio")
    projected_dividend: Optional[float] = Field(
        default=None,
        description="Projected annual dividend income in TZS",
    )
    market_regime: Optional[str] = Field(
        default=None,
        description="Current market regime: NORMAL, BULL, BEAR, HIGH_VOLATILITY, CRISIS",
    )
    regime_adjustments: Optional[str] = Field(
        default=None,
        description="Description of any adjustments made due to market conditions",
    )


class HealthResponse(BaseModel):
    status: str
    version: str
