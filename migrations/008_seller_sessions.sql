CREATE TABLE IF NOT EXISTS seller_sessions (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_seller_sessions_seller_id
ON seller_sessions(seller_id);

CREATE INDEX IF NOT EXISTS idx_seller_sessions_expires_at
ON seller_sessions(expires_at);
