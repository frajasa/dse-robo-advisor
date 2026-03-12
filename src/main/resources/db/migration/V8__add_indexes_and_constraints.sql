-- Add missing indexes on foreign keys for query performance
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolios_user_active ON portfolios(user_id, is_active);
CREATE INDEX idx_portfolio_holdings_portfolio_id ON portfolio_holdings(portfolio_id);
CREATE INDEX idx_portfolio_metrics_portfolio_id ON portfolio_metrics_snapshots(portfolio_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_broker_referrals_user_id ON broker_referrals(user_id);
CREATE INDEX idx_dividend_history_symbol ON dividend_history(symbol);
