ALTER TABLE sellers ADD COLUMN global_user_key TEXT;

UPDATE sellers
SET global_user_key = '0000000000000001'
WHERE id = '001'
  AND global_user_key IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sellers_global_user_key
ON sellers(global_user_key)
WHERE global_user_key IS NOT NULL;
