CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  listing_number INTEGER,
  listing_alias TEXT,
  key_token TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  images TEXT NOT NULL DEFAULT '[]',
  categoryPath TEXT NOT NULL DEFAULT '',
  duration_months INTEGER NOT NULL DEFAULT 0,
  payment_amount REAL NOT NULL DEFAULT 0,
  expires_date TEXT,
  flags INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  grey_zone INTEGER NOT NULL DEFAULT 0,
  grey_zone_until TEXT,
  seller_id TEXT NOT NULL,
  downvote_count INTEGER NOT NULL DEFAULT 0,
  downvoted_by TEXT NOT NULL DEFAULT '[]',
  created_date TEXT NOT NULL,
  updated_date TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_local_listings_listing_number
  ON listings(listing_number)
  WHERE listing_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_local_listings_seller_id
  ON listings(seller_id);
