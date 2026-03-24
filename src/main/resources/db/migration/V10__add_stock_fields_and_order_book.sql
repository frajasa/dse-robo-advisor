-- Add fields from the official DSE API
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS total_shares_issued BIGINT;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS dse_company_id INTEGER;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS security_desc VARCHAR(255);
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS isin VARCHAR(20);
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS cap_size DECIMAL(5,2);

-- Add bid/ask and volume to stock_prices for order-book depth
ALTER TABLE stock_prices ADD COLUMN IF NOT EXISTS best_bid_price DECIMAL(12,4);
ALTER TABLE stock_prices ADD COLUMN IF NOT EXISTS best_bid_qty BIGINT;
ALTER TABLE stock_prices ADD COLUMN IF NOT EXISTS best_ask_price DECIMAL(12,4);
ALTER TABLE stock_prices ADD COLUMN IF NOT EXISTS best_ask_qty BIGINT;
ALTER TABLE stock_prices ADD COLUMN IF NOT EXISTS market_cap DECIMAL(20,2);
ALTER TABLE stock_prices ADD COLUMN IF NOT EXISTS change_pct DECIMAL(8,4);

-- Seed new companies from the official API that were missing
INSERT INTO stocks (symbol, company_name, sector, is_active) VALUES
    ('AFRIPRISE', 'Afriprise',               'Financial',   TRUE),
    ('MUCOBA',    'Mucoba Bank Plc',          'Banking',     TRUE),
    ('IEACLC-ETF','iTrust EAC Large Cap ETF', 'ETF',        TRUE),
    ('VERTEX-ETF','Vertex ETF',               'ETF',         TRUE)
ON CONFLICT (symbol) DO NOTHING;
