-- Replace only the incompatible chat tables with the schema used by the current Worker.
-- Listings, sellers, and all non-chat tables are untouched.
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_conversations;

CREATE TABLE chat_conversations (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  buyer_token_hash TEXT NOT NULL,
  buyer_name TEXT NOT NULL DEFAULT 'Buyer',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(listing_id, buyer_token_hash),
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_conversations_seller_updated
  ON chat_conversations(seller_id, updated_at DESC);

CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK(sender_role IN ('buyer', 'seller')),
  message_text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_messages_conversation_created
  ON chat_messages(conversation_id, created_at ASC);
