CREATE TABLE IF NOT EXISTS listing_history (
  history_id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  seller_id TEXT,
  listing_number INTEGER,
  listing_alias TEXT,
  listing_key_token TEXT,
  event_type TEXT NOT NULL,
  event_at TEXT NOT NULL,
  r2_object_key TEXT NOT NULL,
  snapshot_sha256 TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_local_listing_history_listing
  ON listing_history(listing_id);

CREATE INDEX IF NOT EXISTS idx_local_listing_history_seller
  ON listing_history(seller_id);

CREATE INDEX IF NOT EXISTS idx_local_listing_history_event
  ON listing_history(event_type, event_at);
