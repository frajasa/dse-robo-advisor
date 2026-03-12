CREATE TABLE investor_profiles (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    monthly_income          DECIMAL(18,2),
    capital_available       DECIMAL(18,2),
    risk_tolerance          VARCHAR(20) NOT NULL CHECK (risk_tolerance IN ('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE')),
    investment_horizon      INTEGER NOT NULL,
    primary_goal            VARCHAR(20) NOT NULL CHECK (primary_goal IN ('RETIREMENT', 'EDUCATION', 'WEALTH', 'INCOME')),
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);
