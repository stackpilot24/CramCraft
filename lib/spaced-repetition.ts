export interface SM2Result {
  repetitions: number;
  easinessFactor: number;
  intervalDays: number;
  nextReviewAt: Date;
}

/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Quality ratings (0-5):
 *   0 = Complete blackout — no recall at all
 *   1 = Incorrect, but recognized correct answer on seeing it
 *   2 = Incorrect, but recalled easily after seeing the answer
 *   3 = Correct with significant difficulty
 *   4 = Correct with hesitation
 *   5 = Perfect recall, instant and confident
 */
export function sm2(
  quality: number,
  repetitions: number,
  easinessFactor: number,
  intervalDays: number
): SM2Result {
  if (quality < 0 || quality > 5) {
    throw new Error('Quality must be between 0 and 5');
  }

  let newReps = repetitions;
  let newEF = easinessFactor;
  let newInterval = intervalDays;

  if (quality >= 3) {
    // Correct response — advance the schedule
    if (newReps === 0) {
      newInterval = 1;
    } else if (newReps === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(intervalDays * easinessFactor);
    }
    newReps += 1;
  } else {
    // Incorrect — reset to beginning
    newReps = 0;
    newInterval = 1;
  }

  // Update the easiness factor
  newEF =
    easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEF < 1.3) newEF = 1.3;
  if (newEF > 2.5 && repetitions === 0) newEF = 2.5; // cap initial EF

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  return {
    repetitions: newReps,
    easinessFactor: parseFloat(newEF.toFixed(4)),
    intervalDays: newInterval,
    nextReviewAt,
  };
}

/**
 * Maps human-readable button labels to SM-2 quality values
 */
export const QUALITY_MAP = {
  again: 0,  // Total fail
  hard: 3,   // Correct with significant effort
  good: 4,   // Correct with hesitation
  easy: 5,   // Perfect recall
} as const;

export type QualityLabel = keyof typeof QUALITY_MAP;

/**
 * Returns a human-readable description for each quality rating
 */
export function getQualityDescription(quality: number): string {
  switch (quality) {
    case 0: return 'Complete blackout';
    case 1: return 'Incorrect — recognized answer';
    case 2: return 'Incorrect — easy recall after seeing';
    case 3: return 'Correct with difficulty';
    case 4: return 'Correct with hesitation';
    case 5: return 'Perfect recall';
    default: return 'Unknown';
  }
}

/**
 * Formats interval into human-readable string
 */
export function formatInterval(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.round(days / 7)} week${Math.round(days / 7) > 1 ? 's' : ''}`;
  if (days < 365) return `${Math.round(days / 30)} month${Math.round(days / 30) > 1 ? 's' : ''}`;
  return `${Math.round(days / 365)} year${Math.round(days / 365) > 1 ? 's' : ''}`;
}
