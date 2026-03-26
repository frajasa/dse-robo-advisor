-- PDPC Compliance: Data minimization - only store nickname + password
-- Remove all personal data (email, full_name, phone) from users table

-- Step 1: Add nickname column, defaulting existing users to a generated nickname
ALTER TABLE users ADD COLUMN nickname VARCHAR(50);
UPDATE users SET nickname = COALESCE(SPLIT_PART(email, '@', 1), 'user_' || LEFT(id::text, 8));
ALTER TABLE users ALTER COLUMN nickname SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT uq_users_nickname UNIQUE (nickname);

-- Step 2: Drop personal data columns
ALTER TABLE users DROP COLUMN IF EXISTS email;
ALTER TABLE users DROP COLUMN IF EXISTS full_name;
ALTER TABLE users DROP COLUMN IF EXISTS phone;

-- Step 3: Drop old email index (if exists)
DROP INDEX IF EXISTS idx_users_email;

-- Step 4: Create index on nickname
CREATE INDEX idx_users_nickname ON users(nickname);
