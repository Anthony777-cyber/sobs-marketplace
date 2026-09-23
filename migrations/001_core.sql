PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sellers (
  id TEXT PRIMARY KEY,
  anonymous_tag TEXT NOT NULL UNIQUE,
  identity_ciphertext TEXT NOT NULL,
  identity_key_version INTEGER NOT NULL DEFAULT 1,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sellers_verification
  ON sellers(verification_status);

CREATE TABLE IF NOT EXISTS entry_tickets (
  id TEXT PRIMARY KEY,
  ticket_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  blocked_until TEXT,
  blocked_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_entry_tickets_status
  ON entry_tickets(status);

CREATE TABLE IF NOT EXISTS listing_tickets (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  ticket_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_listing_tickets_listing
  ON listing_tickets(listing_id);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  listing_id TEXT,
  seller_id TEXT,
  provider TEXT NOT NULL,
  provider_reference TEXT,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL,
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_listing
  ON payments(listing_id);

CREATE INDEX IF NOT EXISTS idx_payments_seller
  ON payments(seller_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
  ON payments(status);

CREATE TABLE IF NOT EXISTS listing_credits (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  listing_id TEXT,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  granted_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  used_at TEXT,
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE RESTRICT,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_listing_credits_seller
  ON listing_credits(seller_id);

CREATE TABLE IF NOT EXISTS listing_downvotes (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  entry_ticket_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (entry_ticket_id) REFERENCES entry_tickets(id) ON DELETE CASCADE,
  UNIQUE (listing_id, entry_ticket_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_downvotes_listing
  ON listing_downvotes(listing_id);

CREATE INDEX IF NOT EXISTS idx_listing_downvotes_entry
  ON listing_downvotes(entry_ticket_id);

CREATE TABLE IF NOT EXISTS listing_complaints (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  complaint_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_listing_complaints_listing
  ON listing_complaints(listing_id);

CREATE TABLE IF NOT EXISTS chat_conversations (
  id TEXT PRIMARY KEY,
  listing_id TEXT,
  participant_a_type TEXT NOT NULL,
  participant_a_id TEXT NOT NULL,
  participant_b_type TEXT NOT NULL,
  participant_b_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_message_at TEXT,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_listing
  ON chat_conversations(listing_id);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_participant_a
  ON chat_conversations(participant_a_type, participant_a_id);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_participant_b
  ON chat_conversations(participant_b_type, participant_b_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation
  ON chat_messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS chat_blocks (
  id TEXT PRIMARY KEY,
  blocker_type TEXT NOT NULL,
  blocker_id TEXT NOT NULL,
  blocked_type TEXT NOT NULL,
  blocked_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (blocker_type, blocker_id, blocked_type, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_blocks_blocked
  ON chat_blocks(blocked_type, blocked_id);

CREATE TABLE IF NOT EXISTS chat_mutes (
  id TEXT PRIMARY KEY,
  muter_type TEXT NOT NULL,
  muter_id TEXT NOT NULL,
  muted_type TEXT NOT NULL,
  muted_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (muter_type, muter_id, muted_type, muted_id)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor_type TEXT,
  actor_id TEXT,
  target_type TEXT,
  target_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_events_created
  ON audit_events(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor
  ON audit_events(actor_type, actor_id);

CREATE INDEX IF NOT EXISTS idx_audit_events_target
  ON audit_events(target_type, target_id);
