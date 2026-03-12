CREATE TABLE stocks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol          VARCHAR(10) NOT NULL UNIQUE,
    company_name    VARCHAR(255) NOT NULL,
    sector          VARCHAR(50),
    expected_return DECIMAL(8,6),
    volatility      DECIMAL(8,6),
    dividend_yield  DECIMAL(8,6),
    is_active       BOOLEAN DEFAULT TRUE,
    listed_date     DATE,
    market_cap      DECIMAL(20,2),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
