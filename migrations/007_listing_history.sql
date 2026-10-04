CREATE TABLE IF NOT EXISTS listing_history (
  history_id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  seller_id TEXT,
  listing_number INTEGER,
  listing_alias TEXT,
  listing_key_token TEXT,
  event_type TEXT NOT NULL,
  event_at TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  snapshot_sha256 TEXT
);

CREATE INDEX IF NOT EXISTS idx_listing_history_listing
  ON listing_history(listing_id);

CREATE INDEX IF NOT EXISTS idx_listing_history_event
  ON listing_history(event_type, event_at);

INSERT INTO listing_history (
  history_id,
  listing_id,
  seller_id,
  listing_number,
  listing_alias,
  listing_key_token,
  event_type,
  event_at,
  snapshot_json,
  snapshot_sha256
)
SELECT
  lower(hex(randomblob(16))),
  id,
  seller_id,
  listing_number,
  listing_alias,
  key_token,
  'legacy_snapshot',
  COALESCE(updated_date, created_date, CURRENT_TIMESTAMP),
  json_object(
    'id', id,
    'listing_number', listing_number,
    'listing_alias', listing_alias,
    'key_token', key_token,
    'title', title,
    'description', description,
    'price', price,
    'currency', currency,
    'images', images,
    'categoryPath', categoryPath,
    'duration_months', duration_months,
    'payment_amount', payment_amount,
    'expires_date', expires_date,
    'flags', flags,
    'status', status,
    'grey_zone', grey_zone,
    'grey_zone_until', grey_zone_until,
    'seller_id', seller_id,
    'created_date', created_date,
    'updated_date', updated_date
  ),
  NULL
FROM listings
WHERE NOT EXISTS (
  SELECT 1
  FROM listing_history h
  WHERE h.listing_id = listings.id
);
