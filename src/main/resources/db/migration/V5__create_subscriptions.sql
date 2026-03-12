CREATE TABLE subscriptions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    tier        VARCHAR(20) NOT NULL DEFAULT 'FREE',
    valid_from  TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active   BOOLEAN DEFAULT TRUE,
    payment_ref VARCHAR(255)
);

CREATE TABLE broker_referrals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    broker_name     VARCHAR(255) NOT NULL,
    referral_code   VARCHAR(100),
    status          VARCHAR(20) DEFAULT 'PENDING',
    commission_tzs  DECIMAL(12,2),
    referred_at     TIMESTAMPTZ DEFAULT NOW(),
    converted_at    TIMESTAMPTZ
);
