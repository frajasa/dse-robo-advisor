CREATE TABLE portfolios (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    risk_profile        VARCHAR(20) NOT NULL,
    expected_return     DECIMAL(8,4),
    expected_volatility DECIMAL(8,4),
    sharpe_ratio        DECIMAL(8,4),
    projected_annual_dividend DECIMAL(18,2),
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    last_rebalanced     TIMESTAMPTZ
);

CREATE TABLE portfolio_holdings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id    UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol          VARCHAR(10) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    allocation_pct  DECIMAL(5,2) NOT NULL,
    dividend_yield  DECIMAL(6,4),
    sector          VARCHAR(50),
    rationale       TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE portfolio_metrics_snapshots (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id                UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    expected_annual_return      DECIMAL(8,4),
    expected_volatility         DECIMAL(8,4),
    sharpe_ratio                DECIMAL(8,4),
    projected_annual_dividend   DECIMAL(18,2),
    snapshot_date               DATE NOT NULL,
    created_at                  TIMESTAMPTZ DEFAULT NOW()
);
