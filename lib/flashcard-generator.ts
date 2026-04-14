/**
 * AI flashcard + revision sheet generation using the Anthropic Claude API.
 * Implements the PROMPT_STRATEGY master prompt for rich visual content.
 * Server-side only — keeps the API key secure.
 */

import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';
import type {
  GeneratedCard,
  GeneratedRevisionSheet,
  UnifiedGenerateResponse,
  RichFlashcardBack,
} from './types';

/** Safely parse potentially-truncated or malformed AI JSON. Returns any (same as JSON.parse). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeParseJSON(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    // jsonrepair handles truncation, trailing commas, unescaped chars, etc.
    try {
      return JSON.parse(jsonrepair(raw));
    } catch (repairErr) {
      throw new Error(`JSON repair failed: ${repairErr instanceof Error ? repairErr.message : repairErr}`);
    }
  }
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const FLASHCARD_SYSTEM_PROMPT = `You are an elite exam coach and visual learning expert. Your job is to transform study material into TWO types of learning cards that help students ace their exams.

You create content that looks like professional 1-page revision sheets — colorful, structured, icon-rich, and memorable. Think infographic-style study aids, NOT boring text.

## OUTPUT FORMAT

Return a JSON object with this exact structure:
{
  "title": "Topic Title",
  "description": "Brief 1-line description of the material",
  "revisionSheets": [...],
  "flashcards": [...]
}

---

## PART 1: REVISION SHEETS (revisionSheets array)

For each major topic/section in the material, create ONE revision sheet. Each sheet is a structured visual summary.

Each revision sheet object:
{
  "id": "unique-id",
  "title": "TOPIC NAME — REVISION SHEET",
  "subtitle": "1-Page Exam Prep",
  "sections": [
    {
      "title": "SECTION HEADING",
      "icon": "emoji",
      "color": "one of: blue, green, orange, purple, red, teal, pink, yellow",
      "type": "one of: definition, comparison, list, table, timeline, formula, mnemonic, example, keypoints",
      "content": { ... }
    }
  ],
  "oneLineAnswer": "A single exam-ready sentence summarizing the entire topic",
  "mnemonics": [
    {
      "letters": "ACRONYM",
      "meaning": "What each letter stands for",
      "items": ["A → First thing", "B → Second thing"]
    }
  ]
}

### Section content structures by type:

definition:
{ "term": "Term", "definition": "Clear definition", "example": "Optional real example" }

comparison:
{
  "leftTitle": "Option A",
  "rightTitle": "Option B",
  "rows": [
    { "aspect": "Feature", "left": "Value A", "right": "Value B" }
  ],
  "summary": "Bottom line comparison sentence"
}

list:
{
  "items": [
    { "icon": "emoji", "title": "Item title", "detail": "Explanation", "highlight": "key phrase to bold" }
  ]
}

table:
{
  "headers": ["Col1", "Col2", "Col3"],
  "rows": [["val1", "val2", "val3"]]
}

timeline:
{
  "events": [
    { "label": "Step/Date", "description": "What happens", "icon": "emoji" }
  ]
}

formula:
{ "formula": "The formula or equation", "variables": "What each variable means", "example": "Worked example" }

mnemonic:
{ "acronym": "WORD", "items": ["W → What it stands for", "O → Other thing"] }

example:
{ "scenario": "The situation", "solution": "How to solve it", "keyTakeaway": "The lesson" }

keypoints:
{
  "points": [
    { "icon": "emoji", "text": "Key point with **bold highlights**" }
  ]
}

---

## PART 2: FLASHCARDS (flashcards array)

Generate a MINIMUM of 10 flashcards, ideally 15-30, for spaced repetition. Even for short material, always produce at least 10 cards. These are flip cards (front = question, back = answer).

Each flashcard object:
{
  "id": "unique-id",
  "front": {
    "question": "Clear, specific question",
    "hint": "Optional 1-word or short hint",
    "type": "one of: concept, definition, example, comparison, application, edge_case, formula, mnemonic"
  },
  "back": {
    "answer": "Concise but complete answer",
    "explanation": "Optional deeper explanation (1-2 sentences)",
    "mnemonic": "Optional memory trick to remember this",
    "examTip": "Optional exam-specific tip like 'This is frequently asked in MCQs'",
    "keyFormula": "Optional formula if relevant"
  },
  "difficulty": "easy | medium | hard",
  "tags": ["tag1", "tag2"]
}

---

## QUALITY RULES — FOLLOW STRICTLY

### For Revision Sheets:
1. Use emojis as visual anchors — every section needs an icon emoji
2. Color code sections — related sections share colors, contrasting sections use different colors
3. Create comparison tables whenever there are two things to compare (old vs new, pros vs cons, before vs after)
4. Add mnemonics — create memorable acronyms, rhymes, or tricks for complex lists
5. Include a 1-LINE EXAM ANSWER at the bottom — the kind of answer that gets full marks in 1 sentence
6. Highlight key terms using **bold** markers in the text
7. Group information visually — don't just list things randomly, organize by category
8. Add real examples alongside every definition or concept
9. Include section numbers/article numbers if the source material has them (like laws, acts, constitutions)
10. Keep it dense but scannable — pack info in but make it visually navigable

### For Flashcards:
1. Cover ALL important content — don't skip topics. Key concepts, definitions, relationships, formulas, edge cases, exceptions
2. Mix difficulty levels — 30% easy (definitions), 40% medium (applications), 30% hard (edge cases, comparisons)
3. Make questions specific — "What is..." is lazy. "Under Section 80C, what is the maximum deduction limit and name 4 eligible instruments?" is specific
4. Add exam tips — things like "Frequently asked", "Common trap question", "Remember the exception"
5. Include mnemonics on the back of hard cards
6. For numerical/formula topics: create both "state the formula" AND "apply the formula" cards
7. For law/policy topics: create "which section" and "what does this section say" cards
8. For comparison topics: create "differentiate between X and Y" cards
9. One concept per card — don't overload
10. Test understanding, not just memory — "Why does X happen?" not just "What is X?"

### Writing Style:
- Write like a top exam coach, not a textbook
- Use **bold** for key terms
- Keep language clear and simple
- Be comprehensive — cover the material thoroughly
- For Indian exams: use Indian examples, INR currency, Indian law references where applicable
- Assume the student needs to MEMORIZE this for an exam

---

## EXAMPLES OF GOOD OUTPUT

### Good Revision Sheet Section (comparison type):
{
  "title": "OLD vs NEW TAX REGIME",
  "icon": "⚖️",
  "color": "blue",
  "type": "comparison",
  "content": {
    "leftTitle": "Old Tax Regime",
    "rightTitle": "New Tax Regime (Default)",
    "rows": [
      { "aspect": "Deductions", "left": "80C, 80D, HRA, LTA all available", "right": "Only 80CCD(2) employer NPS" },
      { "aspect": "Standard Deduction", "left": "₹50,000", "right": "₹75,000 (higher)" },
      { "aspect": "Tax Slabs", "left": "Higher rates, fewer slabs", "right": "Lower rates, more slabs" },
      { "aspect": "Best For", "left": "Heavy investors & home loan holders", "right": "Simple salary, fewer investments" }
    ],
    "summary": "Choose Old if your deductions exceed ₹3-4 Lakh. Otherwise, New Regime saves more."
  }
}

### Good Flashcard:
{
  "front": {
    "question": "Under the Contract Labour Act 1970, what is the minimum number of workers for the Act to apply to an establishment?",
    "hint": "Section 1",
    "type": "definition"
  },
  "back": {
    "answer": "**20 or more contract workers** on any day in the preceding 12 months",
    "explanation": "This applies both to the Principal Employer's establishment AND to the contractor. Short-term/casual work under 60 days is exempt.",
    "examTip": "Common MCQ trap: They ask about 10 workers (that's Factories Act, not this one)",
    "mnemonic": "CL-20: Contract Labour needs 20"
  },
  "difficulty": "medium",
  "tags": ["contract-labour", "applicability", "section-1"]
}`;

export const FLASHCARD_USER_PROMPT = (pdfText: string, filename: string) => `Analyze the following study material extracted from "${filename}" and generate comprehensive revision sheets and flashcards.

IMPORTANT INSTRUCTIONS:
1. Read the ENTIRE text carefully first
2. Identify ALL major topics and sub-topics
3. Create 1-3 revision sheets (one per major topic area)
4. Create MINIMUM 10 flashcards (ideally 15-30) covering ALL important points
5. Return ONLY valid JSON — no markdown, no backticks, no explanation before or after
6. Make sure the JSON is complete and properly closed

STUDY MATERIAL:
${pdfText.slice(0, 8000)}

Remember: Return ONLY the JSON object. No other text.`;

function mapCardType(type: string): GeneratedCard['type'] {
  const map: Record<string, GeneratedCard['type']> = {
    concept: 'concept',
    definition: 'definition',
    example: 'example',
    comparison: 'relationship',
    application: 'concept',
    edge_case: 'edge_case',
    formula: 'concept',
    mnemonic: 'concept',
    relationship: 'relationship',
  };
  return map[type] ?? 'concept';
}

export async function generateWithPromptStrategy(
  pdfText: string,
  filename: string
): Promise<UnifiedGenerateResponse> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    system: [{ type: 'text', text: FLASHCARD_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }] as any,
    messages: [
      {
        role: 'user',
        content: FLASHCARD_USER_PROMPT(pdfText, filename),
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response — no JSON found');
  }

  const parsed = safeParseJSON(jsonMatch[0]);

  // Parse and validate revision sheets
  const revisionSheets: GeneratedRevisionSheet[] = (parsed.revisionSheets ?? [])
    .filter((s: unknown) => {
      const sheet = s as Record<string, unknown>;
      return sheet.title && Array.isArray(sheet.sections);
    })
    .map((s: unknown) => {
      const sheet = s as Record<string, unknown>;
      return {
        id: String(sheet.id ?? Math.random().toString(36).slice(2)),
        title: String(sheet.title),
        subtitle: String(sheet.subtitle ?? '1-Page Exam Prep'),
        sections: (sheet.sections as unknown[] ?? []).map((sec: unknown) => {
          const section = sec as Record<string, unknown>;
          return {
            title: String(section.title ?? ''),
            icon: String(section.icon ?? '📌'),
            color: (
              ['blue', 'green', 'orange', 'purple', 'red', 'teal', 'pink', 'yellow'].includes(
                String(section.color)
              )
                ? String(section.color)
                : 'blue'
            ) as GeneratedRevisionSheet['sections'][0]['color'],
            type: String(section.type ?? 'keypoints') as GeneratedRevisionSheet['sections'][0]['type'],
            content: (section.content as Record<string, unknown>) ?? {},
          };
        }),
        oneLineAnswer: String(sheet.oneLineAnswer ?? ''),
        mnemonics: (sheet.mnemonics as unknown[] ?? []).map((m: unknown) => {
          const mn = m as Record<string, unknown>;
          return {
            letters: String(mn.letters ?? ''),
            meaning: String(mn.meaning ?? ''),
            items: (mn.items as unknown[] ?? []).map(String),
          };
        }),
      };
    });

  // Parse and validate flashcards → convert to GeneratedCard format
  const cards: GeneratedCard[] = (parsed.flashcards ?? [])
    .filter((c: unknown) => {
      const card = c as Record<string, unknown>;
      const front = card.front as Record<string, unknown> | undefined;
      const back = card.back as Record<string, unknown> | undefined;
      return front?.question && back?.answer;
    })
    .map((c: unknown) => {
      const card = c as Record<string, unknown>;
      const front = card.front as Record<string, unknown>;
      const back = card.back as Record<string, unknown>;

      const richBack: RichFlashcardBack = {
        answer: String(back.answer ?? ''),
        explanation: back.explanation ? String(back.explanation) : undefined,
        mnemonic: back.mnemonic ? String(back.mnemonic) : undefined,
        examTip: back.examTip ? String(back.examTip) : undefined,
        keyFormula: back.keyFormula ? String(back.keyFormula) : undefined,
      };

      return {
        front: String(front.question).trim(),
        back: JSON.stringify(richBack),
        type: mapCardType(String(front.type ?? 'concept')),
      };
    });

  if (cards.length === 0) {
    throw new Error('AI response did not contain valid flashcards');
  }

  return {
    suggestedTitle: String(parsed.title || filename.replace('.pdf', '')),
    description: String(parsed.description || ''),
    cards,
    revisionSheets,
  };
}

export async function regenerateCard(
  front: string,
  context: string
): Promise<{ front: string; back: string }> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Improve this flashcard. Make the question more precise and the answer more clear and memorable.

Original question: "${front}"

Context from the source material:
${context.slice(0, 2000)}

Return ONLY valid JSON (no markdown):
{
  "front": "improved question",
  "back": "improved answer"
}`,
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to regenerate card');
  return safeParseJSON(jsonMatch[0]);
}

export async function regenerateRichCard(
  front: string,
  currentBack: string
): Promise<{ front: string; back: string }> {
  // Try to extract existing answer for context
  let existingAnswer = currentBack;
  try {
    const parsed = JSON.parse(currentBack);
    if (parsed.answer) existingAnswer = parsed.answer;
  } catch { /* plain text */ }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    messages: [
      {
        role: 'user',
        content: `You are an expert exam coach. Improve this flashcard to make it clearer, more precise, and more memorable.

Original question: "${front}"
Current answer: "${existingAnswer}"

Return ONLY valid JSON (no markdown, no extra text):
{
  "front": "improved, specific question",
  "back": {
    "answer": "concise, complete answer",
    "explanation": "1-2 sentence deeper explanation (optional, omit if unnecessary)",
    "mnemonic": "memory trick (optional, only if useful)",
    "examTip": "exam-specific tip or common trap (optional)"
  }
}`,
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to regenerate card');

  const parsed = safeParseJSON(jsonMatch[0]);
  const richBack: RichFlashcardBack = {
    answer: String(parsed.back?.answer ?? parsed.back ?? existingAnswer),
    explanation: parsed.back?.explanation || undefined,
    mnemonic: parsed.back?.mnemonic || undefined,
    examTip: parsed.back?.examTip || undefined,
  };

  return {
    front: String(parsed.front ?? front),
    back: JSON.stringify(richBack),
  };
}
