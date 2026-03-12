import numpy as np
from typing import Any

# DSE stock universe with fundamental data
# Expected returns and volatilities are annualized estimates
DSE_STOCKS: dict[str, dict[str, Any]] = {
    "NMB": {
        "name": "NMB Bank",
        "expected_return": 0.10,
        "volatility": 0.08,
        "dividend_yield": 0.08,
        "sector": "Banking",
    },
    "CRDB": {
        "name": "CRDB Bank",
        "expected_return": 0.12,
        "volatility": 0.09,
        "dividend_yield": 0.06,
        "sector": "Banking",
    },
    "TBL": {
        "name": "Tanzania Breweries",
        "expected_return": 0.09,
        "volatility": 0.06,
        "dividend_yield": 0.07,
        "sector": "Consumer",
    },
    "VODA": {
        "name": "Vodacom Tanzania",
        "expected_return": 0.11,
        "volatility": 0.10,
        "dividend_yield": 0.065,
        "sector": "Telecom",
    },
    "SWIS": {
        "name": "Swissport Tanzania",
        "expected_return": 0.13,
        "volatility": 0.12,
        "dividend_yield": 0.05,
        "sector": "Aviation",
    },
    "NICO": {
        "name": "NIC Insurance",
        "expected_return": 0.08,
        "volatility": 0.07,
        "dividend_yield": 0.09,
        "sector": "Insurance",
    },
    "GOVB": {
        "name": "Government Bond ETF",
        "expected_return": 0.11,
        "volatility": 0.02,
        "dividend_yield": 0.11,
        "sector": "FixedIncome",
    },
}

STOCK_SYMBOLS = list(DSE_STOCKS.keys())

# Correlation matrix for the 7-asset universe
# Order: NMB, CRDB, TBL, VODA, SWIS, NICO, GOVB
CORRELATION_MATRIX = np.array([
    [1.00, 0.72, 0.35, 0.28, 0.20, 0.25, 0.05],  # NMB
    [0.72, 1.00, 0.38, 0.30, 0.22, 0.27, 0.05],  # CRDB
    [0.35, 0.38, 1.00, 0.40, 0.15, 0.30, 0.03],  # TBL
    [0.28, 0.30, 0.40, 1.00, 0.25, 0.20, 0.04],  # VODA
    [0.20, 0.22, 0.15, 0.25, 1.00, 0.18, 0.02],  # SWIS
    [0.25, 0.27, 0.30, 0.20, 0.18, 1.00, 0.03],  # NICO
    [0.05, 0.05, 0.03, 0.04, 0.02, 0.03, 1.00],  # GOVB
])


def get_covariance_matrix() -> np.ndarray:
    """Build the covariance matrix from individual volatilities and the correlation matrix.

    Cov(i,j) = vol_i * vol_j * corr(i,j)
    """
    volatilities = np.array([
        DSE_STOCKS[symbol]["volatility"] for symbol in STOCK_SYMBOLS
    ])
    # Outer product of volatilities gives vol_i * vol_j matrix
    vol_outer = np.outer(volatilities, volatilities)
    covariance_matrix = vol_outer * CORRELATION_MATRIX
    return covariance_matrix


def get_expected_returns() -> np.ndarray:
    """Return the expected returns vector for all assets."""
    return np.array([
        DSE_STOCKS[symbol]["expected_return"] for symbol in STOCK_SYMBOLS
    ])
