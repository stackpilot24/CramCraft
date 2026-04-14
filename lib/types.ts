export type CardType = 'concept' | 'definition' | 'example' | 'relationship' | 'edge_case';

export interface Deck {
  id: string;
  title: string;
  description: string | null;
  source_filename: string | null;
  card_count: number;
  mastery_percentage: number;
  created_at: string;
  last_studied_at: string | null;
  due_count?: number;
  notes?: string | null;
}

export interface Card {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  card_type: CardType;
  difficulty: number;
  repetitions: number;
  easiness_factor: number;
  interval_days: number;
  next_review_at: string;
  last_reviewed_at: string | null;
}

export interface GeneratedCard {
  front: string;
  back: string;
  type: CardType;
}

export interface GenerateResponse {
  cards: GeneratedCard[];
  suggestedTitle: string;
  description: string;
}

export interface DeckWithCards extends Deck {
  cards: Card[];
  stats: DeckStats;
  noteCards?: NoteCard[];
  revisionSheets?: RevisionSheet[];
}

export interface DeckStats {
  total: number;
  mastered: number;
  learning: number;
  dueToday: number;
  new: number;
}

export interface ReviewResult {
  quality: number; // 0-5 SM-2 rating
}

export interface StudyCardResult {
  cardId: string;
  quality: number;
  timeSpent?: number;
}

export interface SessionSummary {
  totalReviewed: number;
  correct: number;
  incorrect: number;
  averageQuality: number;
  nextReviewTimes: { cardId: string; nextReview: string }[];
}

export interface StudyStats {
  date: string;
  cards_studied: number;
  decks_studied: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDaysStudied: number;
  todayCount: number;
}

// Note Cards (structured study notes generated from PDF)
export type NoteCardCategory =
  | 'overview'
  | 'definition'
  | 'process'
  | 'important'
  | 'formula'
  | 'remember'
  | 'example';

export interface NoteCard {
  id: string;
  deck_id: string;
  title: string;
  key_points: string; // JSON-encoded string[]
  example: string | null;
  category: NoteCardCategory;
  order_index: number;
}

export interface GeneratedNoteCard {
  title: string;
  key_points: string[];
  example?: string;
  category: NoteCardCategory;
}

export interface GenerateWithNotesResponse {
  cards: GeneratedCard[];
  noteCards: GeneratedNoteCard[];
  suggestedTitle: string;
  description: string;
}

// Exam Prep types
export type QuestionImportance = 'must_know' | 'important' | 'good_to_know';
export type QuestionType = 'conceptual' | 'application' | 'analysis' | 'definition' | 'problem_solving';

export interface ExamSession {
  id: string;
  title: string;
  source_filename: string | null;
  summary: string | null;
  question_count: number;
  created_at: string;
}

export interface ExamQuestion {
  id: string;
  session_id: string;
  question: string;
  answer: string;
  importance: QuestionImportance;
  question_type: QuestionType;
  topic: string | null;
  order_index: number;
}

export interface GeneratedExamQuestion {
  question: string;
  answer: string;
  importance: QuestionImportance;
  type: QuestionType;
  topic: string;
}

export interface ExamGenerateResponse {
  questions: GeneratedExamQuestion[];
  suggestedTitle: string;
  summary: string;
}

export interface ExamSessionWithQuestions extends ExamSession {
  questions: ExamQuestion[];
}

// ─── Revision Sheet types (PROMPT_STRATEGY visual infographics) ──────────────

export type SectionColor = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal' | 'pink' | 'yellow';
export type SectionType = 'definition' | 'comparison' | 'list' | 'table' | 'timeline' | 'formula' | 'mnemonic' | 'example' | 'keypoints';

export interface RevisionSheetSection {
  title: string;
  icon: string;
  color: SectionColor;
  type: SectionType;
  content: Record<string, unknown>;
}

export interface RevisionSheetMnemonic {
  letters: string;
  meaning: string;
  items: string[];
}

export interface GeneratedRevisionSheet {
  id: string;
  title: string;
  subtitle: string;
  sections: RevisionSheetSection[];
  oneLineAnswer: string;
  mnemonics: RevisionSheetMnemonic[];
}

// DB row (sections and mnemonics stored as JSON strings)
export interface RevisionSheet {
  id: string;
  deck_id: string;
  title: string;
  subtitle: string | null;
  sections: string;
  one_line_answer: string | null;
  mnemonics: string;
  order_index: number;
}

// ─── Rich Flashcard types (PROMPT_STRATEGY practice cards) ───────────────────

export interface RichFlashcardBack {
  answer: string;
  explanation?: string;
  mnemonic?: string;
  examTip?: string;
  keyFormula?: string;
}

// ─── Unified generate response ────────────────────────────────────────────────

export interface UnifiedGenerateResponse {
  suggestedTitle: string;
  description: string;
  cards: GeneratedCard[];
  revisionSheets: GeneratedRevisionSheet[];
}
