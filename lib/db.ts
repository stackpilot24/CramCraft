import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

const dbPath =
  process.env.NODE_ENV === 'production'
    ? path.join(os.tmpdir(), 'cramcraft.db')
    : path.join(process.cwd(), 'cramcraft.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  const schemaPath = path.join(process.cwd(), 'lib', 'schema.sql');
  let schema: string;

  try {
    schema = fs.readFileSync(schemaPath, 'utf-8');
  } catch {
    schema = `
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
    `;
  }

  db.exec(schema);
  runMigrations();
}

function runMigrations() {
  // Add notes column to decks if missing
  try { db.exec('ALTER TABLE decks ADD COLUMN notes TEXT'); } catch { /* already exists */ }

  // Add user_id to decks if missing
  try { db.exec("ALTER TABLE decks ADD COLUMN user_id TEXT NOT NULL DEFAULT 'local'"); } catch { /* already exists */ }

  // Add user_id to exam_sessions if missing
  try { db.exec("ALTER TABLE exam_sessions ADD COLUMN user_id TEXT NOT NULL DEFAULT 'local'"); } catch { /* already exists */ }

  // Recreate study_stats with (user_id, date) unique constraint if needed
  const cols = db.pragma('table_info(study_stats)') as Array<{ name: string }>;
  if (!cols.some((c) => c.name === 'user_id')) {
    db.exec(`
      CREATE TABLE study_stats_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL DEFAULT 'local',
        date TEXT NOT NULL,
        cards_studied INTEGER DEFAULT 0,
        decks_studied TEXT DEFAULT '[]',
        UNIQUE(user_id, date)
      )
    `);
    db.exec(`
      INSERT OR IGNORE INTO study_stats_new (user_id, date, cards_studied, decks_studied)
      SELECT 'local', date, cards_studied, decks_studied FROM study_stats
    `);
    db.exec('DROP TABLE study_stats');
    db.exec('ALTER TABLE study_stats_new RENAME TO study_stats');
    try { db.exec('CREATE INDEX IF NOT EXISTS idx_study_stats_date ON study_stats(date)'); } catch { /* exists */ }
  }

  // Add revision_sheets if missing
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS revision_sheets (
      id TEXT PRIMARY KEY,
      deck_id TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      sections TEXT NOT NULL,
      one_line_answer TEXT,
      mnemonics TEXT DEFAULT '[]',
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
    )`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_revision_sheets_deck ON revision_sheets(deck_id)');
  } catch { /* exists */ }

  // Add indexes
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_decks_user ON decks(user_id)'); } catch { /* exists */ }
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_exam_sessions_user ON exam_sessions(user_id)'); } catch { /* exists */ }
}

// ─── Decks ────────────────────────────────────────────────────────────────────

export function getAllDecks(userId: string) {
  return getDb().prepare(`
    SELECT d.*, COUNT(c.id) as due_count
    FROM decks d
    LEFT JOIN cards c ON c.deck_id = d.id AND c.next_review_at <= datetime('now')
    WHERE d.user_id = ?
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `).all(userId);
}

export function getDeckById(id: string) {
  return getDb().prepare('SELECT * FROM decks WHERE id = ?').get(id);
}

export function getCardsByDeckId(deckId: string) {
  return getDb()
    .prepare('SELECT * FROM cards WHERE deck_id = ? ORDER BY card_type, front')
    .all(deckId);
}

export function getCardsDueForReview(deckId: string) {
  return getDb()
    .prepare(
      `SELECT * FROM cards
       WHERE deck_id = ? AND next_review_at <= datetime('now')
       ORDER BY
         CASE WHEN next_review_at < datetime('now', '-1 day') THEN 0 ELSE 1 END,
         easiness_factor ASC`
    )
    .all(deckId);
}

export function getCardById(id: string) {
  return getDb().prepare('SELECT * FROM cards WHERE id = ?').get(id);
}

export function createDeck(deck: {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  source_filename?: string;
}) {
  return getDb()
    .prepare(
      'INSERT INTO decks (id, user_id, title, description, source_filename) VALUES (?, ?, ?, ?, ?)'
    )
    .run(deck.id, deck.user_id, deck.title, deck.description ?? null, deck.source_filename ?? null);
}

export function createCard(card: {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  card_type?: string;
}) {
  return getDb()
    .prepare(
      'INSERT INTO cards (id, deck_id, front, back, card_type) VALUES (?, ?, ?, ?, ?)'
    )
    .run(card.id, card.deck_id, card.front, card.back, card.card_type ?? 'concept');
}

export function updateCard(
  id: string,
  data: {
    front?: string;
    back?: string;
    card_type?: string;
    repetitions?: number;
    easiness_factor?: number;
    interval_days?: number;
    next_review_at?: string;
    last_reviewed_at?: string;
    difficulty?: number;
  }
) {
  const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ');
  const values = [...Object.values(data), id];
  return getDb()
    .prepare(`UPDATE cards SET ${fields} WHERE id = ?`)
    .run(...values);
}

export function deleteDeck(id: string) {
  return getDb().prepare('DELETE FROM decks WHERE id = ?').run(id);
}

export function deleteCard(id: string) {
  return getDb().prepare('DELETE FROM cards WHERE id = ?').run(id);
}

export function updateDeckStats(deckId: string) {
  const cards = getCardsByDeckId(deckId) as Array<{
    repetitions: number;
    easiness_factor: number;
  }>;
  const total = cards.length;
  const mastered = cards.filter(
    (c) => c.repetitions >= 3 && c.easiness_factor >= 2.0
  ).length;
  const masteryPct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  getDb()
    .prepare('UPDATE decks SET card_count = ?, mastery_percentage = ? WHERE id = ?')
    .run(total, masteryPct, deckId);
}

export function updateDeckLastStudied(deckId: string) {
  getDb()
    .prepare("UPDATE decks SET last_studied_at = datetime('now') WHERE id = ?")
    .run(deckId);
}

export function recordStudyActivity(userId: string, deckId: string, cardsCount: number) {
  const today = new Date().toISOString().split('T')[0];
  const existing = getDb()
    .prepare('SELECT * FROM study_stats WHERE user_id = ? AND date = ?')
    .get(userId, today) as { cards_studied: number; decks_studied: string } | undefined;

  if (existing) {
    const decks: string[] = JSON.parse(existing.decks_studied);
    if (!decks.includes(deckId)) decks.push(deckId);
    getDb()
      .prepare(
        'UPDATE study_stats SET cards_studied = cards_studied + ?, decks_studied = ? WHERE user_id = ? AND date = ?'
      )
      .run(cardsCount, JSON.stringify(decks), userId, today);
  } else {
    getDb()
      .prepare(
        'INSERT INTO study_stats (user_id, date, cards_studied, decks_studied) VALUES (?, ?, ?, ?)'
      )
      .run(userId, today, cardsCount, JSON.stringify([deckId]));
  }
}

export function getStudyStats(userId: string) {
  return getDb()
    .prepare('SELECT * FROM study_stats WHERE user_id = ? ORDER BY date DESC LIMIT 365')
    .all(userId);
}

export function getAllCardsDue(userId: string, limit = 80) {
  return getDb()
    .prepare(
      `SELECT c.*, d.title as deck_title
       FROM cards c
       JOIN decks d ON c.deck_id = d.id
       WHERE c.next_review_at <= datetime('now')
         AND d.user_id = ?
       ORDER BY
         CASE WHEN c.next_review_at < datetime('now', '-1 day') THEN 0 ELSE 1 END,
         c.easiness_factor ASC
       LIMIT ?`
    )
    .all(userId, limit);
}

// ─── Note Cards ──────────────────────────────────────────────────────────────

export function getNoteCardsByDeckId(deckId: string) {
  return getDb()
    .prepare('SELECT * FROM note_cards WHERE deck_id = ? ORDER BY order_index')
    .all(deckId);
}

export function createNoteCard(card: {
  id: string;
  deck_id: string;
  title: string;
  key_points: string;
  example?: string;
  category: string;
  order_index: number;
}) {
  return getDb()
    .prepare(
      'INSERT INTO note_cards (id, deck_id, title, key_points, example, category, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(card.id, card.deck_id, card.title, card.key_points, card.example ?? null, card.category, card.order_index);
}

export function deleteNoteCardsByDeckId(deckId: string) {
  return getDb().prepare('DELETE FROM note_cards WHERE deck_id = ?').run(deckId);
}

export function saveDeckNotes(deckId: string, notes: string) {
  return getDb()
    .prepare('UPDATE decks SET notes = ? WHERE id = ?')
    .run(notes, deckId);
}

// ─── Exam Sessions ───────────────────────────────────────────────────────────

export function getAllExamSessions(userId: string) {
  return getDb()
    .prepare('SELECT * FROM exam_sessions WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId);
}

export function getExamSessionById(id: string) {
  return getDb().prepare('SELECT * FROM exam_sessions WHERE id = ?').get(id);
}

export function getExamQuestionsBySessionId(sessionId: string) {
  return getDb()
    .prepare(
      `SELECT * FROM exam_questions WHERE session_id = ?
       ORDER BY
         CASE importance WHEN 'must_know' THEN 1 WHEN 'important' THEN 2 ELSE 3 END,
         order_index`
    )
    .all(sessionId);
}

export function createExamSession(session: {
  id: string;
  user_id: string;
  title: string;
  source_filename?: string;
  summary?: string;
  question_count: number;
}) {
  return getDb()
    .prepare(
      'INSERT INTO exam_sessions (id, user_id, title, source_filename, summary, question_count) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(
      session.id,
      session.user_id,
      session.title,
      session.source_filename ?? null,
      session.summary ?? null,
      session.question_count
    );
}

export function createExamQuestion(question: {
  id: string;
  session_id: string;
  question: string;
  answer: string;
  importance: string;
  question_type: string;
  topic?: string;
  order_index: number;
}) {
  return getDb()
    .prepare(
      `INSERT INTO exam_questions
        (id, session_id, question, answer, importance, question_type, topic, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      question.id,
      question.session_id,
      question.question,
      question.answer,
      question.importance,
      question.question_type,
      question.topic ?? null,
      question.order_index
    );
}

export function deleteExamSession(id: string) {
  return getDb().prepare('DELETE FROM exam_sessions WHERE id = ?').run(id);
}

// ─── Revision Sheets ─────────────────────────────────────────────────────────

export function getRevisionSheetsByDeckId(deckId: string) {
  return getDb()
    .prepare('SELECT * FROM revision_sheets WHERE deck_id = ? ORDER BY order_index')
    .all(deckId);
}

export function createRevisionSheet(sheet: {
  id: string;
  deck_id: string;
  title: string;
  subtitle?: string;
  sections: string;
  one_line_answer?: string;
  mnemonics?: string;
  order_index: number;
}) {
  return getDb()
    .prepare(
      'INSERT INTO revision_sheets (id, deck_id, title, subtitle, sections, one_line_answer, mnemonics, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      sheet.id,
      sheet.deck_id,
      sheet.title,
      sheet.subtitle ?? null,
      sheet.sections,
      sheet.one_line_answer ?? null,
      sheet.mnemonics ?? '[]',
      sheet.order_index
    );
}

export function deleteRevisionSheetsByDeckId(deckId: string) {
  return getDb().prepare('DELETE FROM revision_sheets WHERE deck_id = ?').run(deckId);
}

export default getDb;
