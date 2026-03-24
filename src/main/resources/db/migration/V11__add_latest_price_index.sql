-- Composite index to support the DISTINCT ON (symbol) ... ORDER BY symbol, price_date DESC query
CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol_date_desc
    ON stock_prices (symbol, price_date DESC);
