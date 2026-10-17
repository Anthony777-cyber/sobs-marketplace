CREATE TABLE sellers (
  id TEXT PRIMARY KEY,
  anonymous_tag TEXT NOT NULL UNIQUE,
  identity_ciphertext TEXT NOT NULL,
  identity_key_version INTEGER NOT NULL DEFAULT 1,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  global_user_key TEXT UNIQUE,
  login_secret_hash TEXT
);

CREATE TABLE seller_sessions (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX idx_local_seller_sessions_seller_id ON seller_sessions(seller_id);

CREATE TABLE seller_login_attempts (
  attempt_key TEXT PRIMARY KEY,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  updated_at TEXT NOT NULL
);

INSERT INTO sellers
  (id, anonymous_tag, identity_ciphertext, identity_key_version, verification_status, created_at, updated_at, global_user_key)
VALUES
  ('001', 'LOCAL-TEST-001', 'LOCAL-TEST-IDENTITY', 1, 'verified', datetime('now'), datetime('now'), '0000000000000001');

INSERT INTO sellers
  (id, anonymous_tag, identity_ciphertext, identity_key_version, verification_status, created_at, updated_at, global_user_key)
VALUES
  ('001', 'LOCAL-TEST-001', 'LOCAL-TEST-IDENTITY', 1, 'verified', datetime('now'), datetime('now'), '0000000000000001');
