CREATE TABLE IF NOT EXISTS decks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'local',
  title TEXT NOT NULL,
  description TEXT,
  source_filename TEXT,
  card_count INTEGER DEFAULT 0,
  mastery_percentage REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_studied_at DATETIME
);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  deck_id TEXT NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  card_type TEXT DEFAULT 'concept',
  difficulty INTEGER DEFAULT 0,
  -- SM-2 spaced repetition fields
  repetitions INTEGER DEFAULT 0,
  easiness_factor REAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 0,
  next_review_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_reviewed_at DATETIME,
  FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'local',
  date TEXT NOT NULL,
  cards_studied INTEGER DEFAULT 0,
  decks_studied TEXT DEFAULT '[]',
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_cards_next_review ON cards(next_review_at);
CREATE INDEX IF NOT EXISTS idx_study_stats_date ON study_stats(date);

CREATE TABLE IF NOT EXISTS exam_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'local',
  title TEXT NOT NULL,
  source_filename TEXT,
  summary TEXT,
  question_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_questions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  importance TEXT DEFAULT 'important',
  question_type TEXT DEFAULT 'conceptual',
  topic TEXT,
  order_index INTEGER DEFAULT 0,
  FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_exam_questions_session ON exam_questions(session_id);

CREATE TABLE IF NOT EXISTS note_cards (
  id TEXT PRIMARY KEY,
  deck_id TEXT NOT NULL,
  title TEXT NOT NULL,
  key_points TEXT NOT NULL,
  example TEXT,
  category TEXT DEFAULT 'overview',
  order_index INTEGER DEFAULT 0,
  FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_note_cards_deck ON note_cards(deck_id);

CREATE TABLE IF NOT EXISTS revision_sheets (
  id TEXT PRIMARY KEY,
  deck_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  sections TEXT NOT NULL,
  one_line_answer TEXT,
  mnemonics TEXT DEFAULT '[]',
  order_index INTEGER DEFAULT 0,
  FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_revision_sheets_deck ON revision_sheets(deck_id);
