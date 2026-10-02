INSERT OR IGNORE INTO sellers
  (id, anonymous_tag, identity_ciphertext, identity_key_version, verification_status, created_at, updated_at)
VALUES
  ('001', 'TEST-001', 'TEST-IDENTITY-001', 1, 'verified',
   datetime('now'), datetime('now'));
