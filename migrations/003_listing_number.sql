ALTER TABLE listings ADD COLUMN listing_number INTEGER;

CREATE UNIQUE INDEX idx_listings_listing_number
ON listings(listing_number);

WITH numbered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_date ASC, id ASC) AS n
  FROM listings
)
UPDATE listings
SET listing_number = (
  SELECT n
  FROM numbered
  WHERE numbered.id = listings.id
);

CREATE TABLE listing_number_counter (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  next_number INTEGER NOT NULL
);

INSERT INTO listing_number_counter (id, next_number)
SELECT 1, COALESCE(MAX(listing_number), 0) + 1
FROM listings;
