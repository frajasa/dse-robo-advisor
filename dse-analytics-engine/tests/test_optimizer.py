import pytest

from app.services.optimizer import optimize_portfolio


@pytest.fixture
def conservative_result():
    return optimize_portfolio(
        risk_tolerance="conservative",
        investment_amount=10_000_000.0,
    )


@pytest.fixture
def moderate_result():
    return optimize_portfolio(
        risk_tolerance="moderate",
        investment_amount=10_000_000.0,
    )


@pytest.fixture
def aggressive_result():
    return optimize_portfolio(
        risk_tolerance="aggressive",
        investment_amount=10_000_000.0,
    )


class TestWeightsConstraints:
    """Test that portfolio weights satisfy basic constraints."""

    def test_weights_sum_to_100(self, conservative_result):
        total = sum(h.allocation for h in conservative_result.holdings)
        assert abs(total - 100.0) < 2.0, (
            f"Conservative portfolio weights sum to {total}, expected ~100%"
        )

    def test_weights_sum_to_100_moderate(self, moderate_result):
        total = sum(h.allocation for h in moderate_result.holdings)
        assert abs(total - 100.0) < 2.0, (
            f"Moderate portfolio weights sum to {total}, expected ~100%"
        )

    def test_weights_sum_to_100_aggressive(self, aggressive_result):
        total = sum(h.allocation for h in aggressive_result.holdings)
        assert abs(total - 100.0) < 2.0, (
            f"Aggressive portfolio weights sum to {total}, expected ~100%"
        )

    def test_all_weights_non_negative(self, conservative_result):
        for holding in conservative_result.holdings:
            assert holding.allocation >= 0, (
                f"{holding.symbol} has negative allocation: {holding.allocation}"
            )

    def test_all_weights_non_negative_moderate(self, moderate_result):
        for holding in moderate_result.holdings:
            assert holding.allocation >= 0, (
                f"{holding.symbol} has negative allocation: {holding.allocation}"
            )

    def test_all_weights_non_negative_aggressive(self, aggressive_result):
        for holding in aggressive_result.holdings:
            assert holding.allocation >= 0, (
                f"{holding.symbol} has negative allocation: {holding.allocation}"
            )


class TestConservativeConstraints:
    """Test constraints specific to conservative portfolios."""

    def test_conservative_has_minimum_bonds(self, conservative_result):
        bond_allocation = 0.0
        for holding in conservative_result.holdings:
            if holding.sector == "FixedIncome":
                bond_allocation += holding.allocation
        assert bond_allocation >= 15.0, (
            f"Conservative portfolio has {bond_allocation}% bonds, expected >= 15%"
        )

    def test_conservative_equity_within_limit(self, conservative_result):
        equity_allocation = 0.0
        for holding in conservative_result.holdings:
            if holding.sector != "FixedIncome":
                equity_allocation += holding.allocation
        assert equity_allocation <= 66.0, (
            f"Conservative equity allocation {equity_allocation}% exceeds 65% limit"
        )


class TestSharpeRatio:
    """Test that Sharpe ratios are positive and reasonable."""

    def test_conservative_sharpe_positive(self, conservative_result):
        assert conservative_result.sharpe_ratio > 0, (
            f"Conservative Sharpe ratio is {conservative_result.sharpe_ratio}, expected > 0"
        )

    def test_moderate_sharpe_positive(self, moderate_result):
        assert moderate_result.sharpe_ratio > 0, (
            f"Moderate Sharpe ratio is {moderate_result.sharpe_ratio}, expected > 0"
        )

    def test_aggressive_sharpe_positive(self, aggressive_result):
        assert aggressive_result.sharpe_ratio > 0, (
            f"Aggressive Sharpe ratio is {aggressive_result.sharpe_ratio}, expected > 0"
        )


class TestRiskToleranceDifferences:
    """Test that different risk tolerances produce meaningfully different results."""

    def test_aggressive_higher_return_than_conservative(
        self, conservative_result, aggressive_result
    ):
        assert aggressive_result.expected_annual_return >= conservative_result.expected_annual_return, (
            f"Aggressive return {aggressive_result.expected_annual_return} "
            f"should be >= conservative return {conservative_result.expected_annual_return}"
        )

    def test_aggressive_higher_volatility_than_conservative(
        self, conservative_result, aggressive_result
    ):
        assert aggressive_result.expected_volatility >= conservative_result.expected_volatility, (
            f"Aggressive volatility {aggressive_result.expected_volatility} "
            f"should be >= conservative volatility {conservative_result.expected_volatility}"
        )

    def test_different_risk_levels_produce_different_allocations(
        self, conservative_result, moderate_result, aggressive_result
    ):
        def allocation_map(result):
            return {h.symbol: h.allocation for h in result.holdings}

        cons_map = allocation_map(conservative_result)
        mod_map = allocation_map(moderate_result)
        agg_map = allocation_map(aggressive_result)

        # At least one allocation must differ between conservative and aggressive
        all_symbols = set(cons_map.keys()) | set(agg_map.keys())
        differences = 0
        for symbol in all_symbols:
            cons_alloc = cons_map.get(symbol, 0.0)
            agg_alloc = agg_map.get(symbol, 0.0)
            if abs(cons_alloc - agg_alloc) > 1.0:
                differences += 1

        assert differences > 0, (
            "Conservative and aggressive portfolios should have different allocations"
        )


class TestPortfolioMetrics:
    """Test that portfolio metrics are within reasonable ranges."""

    def test_expected_return_in_range(self, moderate_result):
        assert 0.05 <= moderate_result.expected_annual_return <= 0.20, (
            f"Expected return {moderate_result.expected_annual_return} outside reasonable range"
        )

    def test_expected_volatility_in_range(self, moderate_result):
        assert 0.01 <= moderate_result.expected_volatility <= 0.15, (
            f"Expected volatility {moderate_result.expected_volatility} outside reasonable range"
        )

    def test_projected_dividend_positive(self, moderate_result):
        assert moderate_result.projected_dividend is not None
        assert moderate_result.projected_dividend > 0, (
            f"Projected dividend {moderate_result.projected_dividend} should be positive"
        )

    def test_holdings_have_rationale(self, moderate_result):
        for holding in moderate_result.holdings:
            assert len(holding.rationale) > 0, (
                f"{holding.symbol} is missing a rationale string"
            )


class TestInvalidInput:
    """Test that invalid inputs are handled properly."""

    def test_invalid_risk_tolerance_raises(self):
        with pytest.raises(ValueError):
            optimize_portfolio(
                risk_tolerance="extremely_risky",
                investment_amount=10_000_000.0,
            )
