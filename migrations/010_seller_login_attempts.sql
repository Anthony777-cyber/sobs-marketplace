CREATE TABLE IF NOT EXISTS seller_login_attempts (
  attempt_key TEXT PRIMARY KEY,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_seller_login_attempts_locked_until
ON seller_login_attempts(locked_until);
