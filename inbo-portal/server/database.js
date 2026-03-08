const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use /data on Render (persistent disk) or local data folder in dev
const dataDir = process.env.NODE_ENV === 'production'
  ? '/data'
  : path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const DB_PATH = path.join(dataDir, 'inbo.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    role TEXT DEFAULT 'client',
    plan TEXT DEFAULT 'starter',
    plan_status TEXT DEFAULT 'active',
    bonus_credits INTEGER DEFAULT 0,
    suspended INTEGER DEFAULT 0,
    gmail_connected INTEGER DEFAULT 0,
    outlook_connected INTEGER DEFAULT 0,
    gmail_email TEXT,
    outlook_email TEXT,
    gmail_access_token TEXT,
    gmail_refresh_token TEXT,
    gmail_token_expires INTEGER,
    tone_profile TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS emails (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    message_id TEXT,
    provider TEXT DEFAULT 'gmail',
    from_name TEXT,
    from_email TEXT,
    subject TEXT,
    body_preview TEXT,
    full_body TEXT,
    category TEXT DEFAULT 'uncategorised',
    status TEXT DEFAULT 'unread',
    has_draft INTEGER DEFAULT 0,
    draft_content TEXT,
    draft_approved INTEGER DEFAULT 0,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_emails_user ON emails(user_id);
  CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

  CREATE TABLE IF NOT EXISTS chat_conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id)
  );

  CREATE INDEX IF NOT EXISTS idx_chat_convos_user ON chat_conversations(user_id);
  CREATE INDEX IF NOT EXISTS idx_chat_msgs_convo ON chat_messages(conversation_id);
`);

// ── Migrations: add columns if they don't exist ───────────────────────────────
const existingCols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
const addIfMissing = (col, def) => {
  if (!existingCols.includes(col)) {
    db.prepare(`ALTER TABLE users ADD COLUMN ${col} ${def}`).run();
    console.log(`Migration: added column ${col}`);
  }
};
addIfMissing('gmail_access_token', 'TEXT');
addIfMissing('gmail_refresh_token', 'TEXT');
addIfMissing('gmail_token_expires', 'INTEGER');
addIfMissing('gmail_watch_expiry', 'INTEGER');

const existingEmailCols = db.prepare("PRAGMA table_info(emails)").all().map(c => c.name);
const addEmailColIfMissing = (col, def) => {
  if (!existingEmailCols.includes(col)) {
    db.prepare(`ALTER TABLE emails ADD COLUMN ${col} ${def}`).run();
    console.log(`Migration: added emails column ${col}`);
  }
};
addEmailColIfMissing('thread_id', 'TEXT');
addEmailColIfMissing('body_html', 'TEXT');

module.exports = db;
