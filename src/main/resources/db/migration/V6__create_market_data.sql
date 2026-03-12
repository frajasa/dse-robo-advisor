CREATE TABLE stock_prices (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol      VARCHAR(10) NOT NULL,
    open_price  DECIMAL(12,4),
    close_price DECIMAL(12,4),
    high_price  DECIMAL(12,4),
    low_price   DECIMAL(12,4),
    volume      BIGINT,
    price_date  DATE NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symbol, price_date)
);

CREATE INDEX idx_stock_prices_symbol_date ON stock_prices(symbol, price_date DESC);

CREATE TABLE dividend_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol          VARCHAR(10) NOT NULL,
    dividend_amount DECIMAL(12,4) NOT NULL,
    ex_date         DATE NOT NULL,
    pay_date        DATE,
    dividend_type   VARCHAR(20) DEFAULT 'ANNUAL',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
