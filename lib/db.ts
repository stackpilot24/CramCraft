/**
 * Database layer — Supabase (PostgreSQL) via the `postgres` package.
 * All functions are async. SQL uses $1/$2 positional params (PostgreSQL style).
 */

import postgres from 'postgres';

// ─── Singleton connection ─────────────────────────────────────────────────────

const g = globalThis as unknown as { _pgSql?: ReturnType<typeof postgres> };

function getSql() {
  if (!g._pgSql) {
    const url = process.env.SUPABASE_DATABASE_URL;
    if (!url) throw new Error('SUPABASE_DATABASE_URL env var is not set');
    g._pgSql = postgres(url, {
      ssl: 'require',
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return g._pgSql;
}

// ─── Schema bootstrap (idempotent — safe on every cold start) ─────────────────

let _bootstrapped = false;

async function ensureSchema() {
  if (_bootstrapped) return;
  _bootstrapped = true;
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'local',
      title TEXT NOT NULL,
      description TEXT,
      source_filename TEXT,
      notes TEXT,
      card_count INTEGER DEFAULT 0,
      mastery_percentage REAL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_studied_at TIMESTAMPTZ
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      card_type TEXT DEFAULT 'concept',
      difficulty INTEGER DEFAULT 0,
      repetitions INTEGER DEFAULT 0,
      easiness_factor REAL DEFAULT 2.5,
      interval_days INTEGER DEFAULT 0,
      next_review_at TIMESTAMPTZ DEFAULT NOW(),
      last_reviewed_at TIMESTAMPTZ
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS study_stats (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'local',
      date TEXT NOT NULL,
      cards_studied INTEGER DEFAULT 0,
      decks_studied TEXT DEFAULT '[]',
      UNIQUE(user_id, date)
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS exam_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'local',
      title TEXT NOT NULL,
      source_filename TEXT,
      summary TEXT,
      question_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS exam_questions (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      importance TEXT DEFAULT 'important',
      question_type TEXT DEFAULT 'conceptual',
      topic TEXT,
      order_index INTEGER DEFAULT 0
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS revision_sheets (
      id TEXT PRIMARY KEY,
      deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      subtitle TEXT,
      sections TEXT NOT NULL,
      one_line_answer TEXT,
      mnemonics TEXT DEFAULT '[]',
      order_index INTEGER DEFAULT 0
    )`;

  // Indexes (IF NOT EXISTS silently skips if already present)
  await sql`CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_cards_next_review ON cards(next_review_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_study_stats_user_date ON study_stats(user_id, date)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_exam_questions_session ON exam_questions(session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_revision_sheets_deck ON revision_sheets(deck_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_decks_user ON decks(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_exam_sessions_user ON exam_sessions(user_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      image TEXT,
      first_seen_at TIMESTAMPTZ DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ DEFAULT NOW()
    )`;
}

async function db() {
  await ensureSchema();
  return getSql();
}

// ─── Decks ────────────────────────────────────────────────────────────────────

export async function getAllDecks(userId: string) {
  const sql = await db();
  return sql`
    SELECT d.*, COUNT(c.id)::int AS due_count
    FROM decks d
    LEFT JOIN cards c ON c.deck_id = d.id AND c.next_review_at <= NOW()
    WHERE d.user_id = ${userId}
    GROUP BY d.id
    ORDER BY d.created_at DESC`;
}

export async function getDeckById(id: string) {
  const sql = await db();
  const rows = await sql`SELECT * FROM decks WHERE id = ${id}`;
  return rows[0] ?? null;
}

export async function createDeck(deck: {
  id: string; user_id: string; title: string; description?: string; source_filename?: string;
}) {
  const sql = await db();
  await sql`
    INSERT INTO decks (id, user_id, title, description, source_filename)
    VALUES (${deck.id}, ${deck.user_id}, ${deck.title}, ${deck.description ?? null}, ${deck.source_filename ?? null})`;
}

export async function updateDeck(id: string, data: { title?: string; description?: string | null }) {
  const sql = await db();
  if (data.title !== undefined && data.description !== undefined) {
    await sql`UPDATE decks SET title = ${data.title}, description = ${data.description} WHERE id = ${id}`;
  } else if (data.title !== undefined) {
    await sql`UPDATE decks SET title = ${data.title} WHERE id = ${id}`;
  } else if (data.description !== undefined) {
    await sql`UPDATE decks SET description = ${data.description} WHERE id = ${id}`;
  }
}

export async function deleteDeck(id: string) {
  const sql = await db();
  await sql`DELETE FROM decks WHERE id = ${id}`;
}

export async function updateDeckStats(deckId: string) {
  const sql = await db();
  const cards = await sql`SELECT repetitions, easiness_factor FROM cards WHERE deck_id = ${deckId}`;
  const total = cards.length;
  const mastered = cards.filter(c => Number(c.repetitions) >= 3 && Number(c.easiness_factor) >= 2.0).length;
  const masteryPct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  await sql`UPDATE decks SET card_count = ${total}, mastery_percentage = ${masteryPct} WHERE id = ${deckId}`;
}

export async function updateDeckLastStudied(deckId: string) {
  const sql = await db();
  await sql`UPDATE decks SET last_studied_at = NOW() WHERE id = ${deckId}`;
}

export async function saveDeckNotes(deckId: string, notes: string) {
  const sql = await db();
  await sql`UPDATE decks SET notes = ${notes} WHERE id = ${deckId}`;
}

// ─── Cards ────────────────────────────────────────────────────────────────────

export async function getCardsByDeckId(deckId: string) {
  const sql = await db();
  return sql`SELECT * FROM cards WHERE deck_id = ${deckId} ORDER BY card_type, front`;
}

export async function getCardsDueForReview(deckId: string) {
  const sql = await db();
  return sql`
    SELECT * FROM cards
    WHERE deck_id = ${deckId} AND next_review_at <= NOW()
    ORDER BY
      CASE WHEN next_review_at < NOW() - INTERVAL '1 day' THEN 0 ELSE 1 END,
      easiness_factor ASC`;
}

export async function getCardById(id: string) {
  const sql = await db();
  const rows = await sql`SELECT * FROM cards WHERE id = ${id}`;
  return rows[0] ?? null;
}

export async function createCard(card: {
  id: string; deck_id: string; front: string; back: string; card_type?: string;
}) {
  const sql = await db();
  await sql`
    INSERT INTO cards (id, deck_id, front, back, card_type)
    VALUES (${card.id}, ${card.deck_id}, ${card.front}, ${card.back}, ${card.card_type ?? 'concept'})`;
}

export async function updateCard(id: string, data: {
  front?: string; back?: string; card_type?: string;
  repetitions?: number; easiness_factor?: number; interval_days?: number;
  next_review_at?: string; last_reviewed_at?: string; difficulty?: number;
}) {
  const sql = await db();
  // Build dynamic SET clause safely — keys come from our own code, not user input
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;
  const setClauses = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ');
  const values = [...entries.map(([, v]) => v), id];
  await sql.unsafe(`UPDATE cards SET ${setClauses} WHERE id = $${values.length}`, values as postgres.ParameterOrJSON<never>[]);
}

export async function deleteCard(id: string) {
  const sql = await db();
  await sql`DELETE FROM cards WHERE id = ${id}`;
}

export async function getAllCardsDue(userId: string, limit = 80) {
  const sql = await db();
  return sql`
    SELECT c.*, d.title AS deck_title
    FROM cards c
    JOIN decks d ON c.deck_id = d.id
    WHERE c.next_review_at <= NOW() AND d.user_id = ${userId}
    ORDER BY
      CASE WHEN c.next_review_at < NOW() - INTERVAL '1 day' THEN 0 ELSE 1 END,
      c.easiness_factor ASC
    LIMIT ${limit}`;
}

// ─── Study stats ──────────────────────────────────────────────────────────────

export async function recordStudyActivity(userId: string, deckId: string, cardsCount: number) {
  const sql = await db();
  const today = new Date().toISOString().split('T')[0];
  const existing = await sql`
    SELECT cards_studied, decks_studied FROM study_stats WHERE user_id = ${userId} AND date = ${today}`;

  if (existing.length > 0) {
    const decks: string[] = JSON.parse(String(existing[0].decks_studied ?? '[]'));
    if (!decks.includes(deckId)) decks.push(deckId);
    await sql`
      UPDATE study_stats SET cards_studied = cards_studied + ${cardsCount}, decks_studied = ${JSON.stringify(decks)}
      WHERE user_id = ${userId} AND date = ${today}`;
  } else {
    await sql`
      INSERT INTO study_stats (user_id, date, cards_studied, decks_studied)
      VALUES (${userId}, ${today}, ${cardsCount}, ${JSON.stringify([deckId])})`;
  }
}

export async function getStudyStats(userId: string) {
  const sql = await db();
  return sql`SELECT * FROM study_stats WHERE user_id = ${userId} ORDER BY date DESC LIMIT 365`;
}

// ─── Revision sheets ─────────────────────────────────────────────────────────

export async function getRevisionSheetsByDeckId(deckId: string) {
  const sql = await db();
  return sql`SELECT * FROM revision_sheets WHERE deck_id = ${deckId} ORDER BY order_index`;
}

export async function createRevisionSheet(sheet: {
  id: string; deck_id: string; title: string; subtitle?: string;
  sections: string; one_line_answer?: string; mnemonics?: string; order_index: number;
}) {
  const sql = await db();
  await sql`
    INSERT INTO revision_sheets (id, deck_id, title, subtitle, sections, one_line_answer, mnemonics, order_index)
    VALUES (${sheet.id}, ${sheet.deck_id}, ${sheet.title}, ${sheet.subtitle ?? null},
            ${sheet.sections}, ${sheet.one_line_answer ?? null}, ${sheet.mnemonics ?? '[]'}, ${sheet.order_index})`;
}

// ─── Exam sessions ────────────────────────────────────────────────────────────

export async function getAllExamSessions(userId: string) {
  const sql = await db();
  return sql`SELECT * FROM exam_sessions WHERE user_id = ${userId} ORDER BY created_at DESC`;
}

export async function getExamSessionById(id: string) {
  const sql = await db();
  const rows = await sql`SELECT * FROM exam_sessions WHERE id = ${id}`;
  return rows[0] ?? null;
}

export async function getExamQuestionsBySessionId(sessionId: string) {
  const sql = await db();
  return sql`
    SELECT * FROM exam_questions WHERE session_id = ${sessionId}
    ORDER BY
      CASE importance WHEN 'must_know' THEN 1 WHEN 'important' THEN 2 ELSE 3 END,
      order_index`;
}

export async function createExamSession(session: {
  id: string; user_id: string; title: string;
  source_filename?: string; summary?: string; question_count: number;
}) {
  const sql = await db();
  await sql`
    INSERT INTO exam_sessions (id, user_id, title, source_filename, summary, question_count)
    VALUES (${session.id}, ${session.user_id}, ${session.title},
            ${session.source_filename ?? null}, ${session.summary ?? null}, ${session.question_count})`;
}

export async function createExamQuestion(q: {
  id: string; session_id: string; question: string; answer: string;
  importance: string; question_type: string; topic?: string; order_index: number;
}) {
  const sql = await db();
  await sql`
    INSERT INTO exam_questions (id, session_id, question, answer, importance, question_type, topic, order_index)
    VALUES (${q.id}, ${q.session_id}, ${q.question}, ${q.answer},
            ${q.importance}, ${q.question_type}, ${q.topic ?? null}, ${q.order_index})`;
}

export async function deleteExamSession(id: string) {
  const sql = await db();
  await sql`DELETE FROM exam_sessions WHERE id = ${id}`;
}

// ─── Note cards (legacy) ─────────────────────────────────────────────────────

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  const sql = await db();
  await sql`
    INSERT INTO users (id, email, name, image, first_seen_at, last_seen_at)
    VALUES (${user.id}, ${user.email}, ${user.name ?? null}, ${user.image ?? null}, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      image = EXCLUDED.image,
      last_seen_at = NOW()`;
}

export async function getNoteCardsByDeckId(deckId: string) {
  const sql = await db();
  try {
    return await sql`SELECT * FROM note_cards WHERE deck_id = ${deckId} ORDER BY order_index`;
  } catch { return []; }
}
