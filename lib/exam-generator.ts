/**
 * AI exam prep generation using the Anthropic Claude API.
 * Server-side only — keeps the API key secure.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ExamGenerateResponse, GeneratedExamQuestion } from './types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert exam coach and educator. You analyze study material and identify the most likely exam questions, providing comprehensive model answers that would score full marks. Your questions are:
- Precisely worded as they would appear in a real exam
- Answered comprehensively — covering all key points an examiner expects
- Categorized by importance based on how frequently tested they are
- Organized by topic for efficient study

You always return valid JSON with no extra text or markdown.`;

export async function generateExamPrep(
  pdfText: string,
  filename: string
): Promise<ExamGenerateResponse> {
  const truncatedText = pdfText.slice(0, 14000);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 10000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analyze this study material from "${filename}" and generate comprehensive exam preparation questions.

RULES:
- Generate 15–25 questions total:
  • "must_know": 5–8 questions — core concepts, definitions, fundamental principles that always appear in exams
  • "important": 6–10 questions — key applications, processes, comparisons, relationships
  • "good_to_know": 4–7 questions — edge cases, nuances, bonus knowledge for top marks
- Question types: "conceptual" | "application" | "analysis" | "definition" | "problem_solving"
- Answers: 3–6 sentences, comprehensive, cover ALL key points an examiner expects
- Group related questions under the same topic name
- Write as a real exam coach — focus on what's actually tested in exams, not just what's interesting

Also generate:
- A concise session title (3–6 words)
- A 2–3 sentence summary of what this material covers and key exam focus areas

Return ONLY this valid JSON object (no markdown, no extra text):
{
  "suggestedTitle": "Title Here",
  "summary": "Brief summary of material and exam focus areas...",
  "questions": [
    {
      "question": "exam question text",
      "answer": "comprehensive model answer covering all key points",
      "importance": "must_know",
      "type": "conceptual",
      "topic": "Topic Name"
    }
  ]
}

TEXT:
${truncatedText}`,
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse exam prep response from AI');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error('AI response did not contain a valid questions array');
  }

  const questions: GeneratedExamQuestion[] = parsed.questions
    .filter((q: unknown) => {
      const ques = q as Record<string, unknown>;
      return ques.question && ques.answer && typeof ques.question === 'string';
    })
    .map((q: unknown, i: number) => {
      const ques = q as Record<string, unknown>;
      return {
        question: String(ques.question).trim(),
        answer: String(ques.answer).trim(),
        importance: (
          ['must_know', 'important', 'good_to_know'].includes(String(ques.importance))
            ? String(ques.importance)
            : 'important'
        ) as GeneratedExamQuestion['importance'],
        type: (
          ['conceptual', 'application', 'analysis', 'definition', 'problem_solving'].includes(
            String(ques.type)
          )
            ? String(ques.type)
            : 'conceptual'
        ) as GeneratedExamQuestion['type'],
        topic: String(ques.topic || 'General'),
        order_index: i,
      };
    });

  return {
    questions,
    suggestedTitle: parsed.suggestedTitle || filename.replace('.pdf', ''),
    summary: parsed.summary || '',
  };
}
