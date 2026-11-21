export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

export type SrsCard = {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  dueAt: number;
  lastReviewedAt: number | null;
};

export const initialCard = (now: number): SrsCard => ({
  repetitions: 0,
  easeFactor: 2.5,
  intervalDays: 1,
  dueAt: now + 86_400_000,
  lastReviewedAt: null,
});

const gradeQuality: Record<ReviewGrade, number> = { again: 2, hard: 3, good: 4, easy: 5 };

export function reviewCard(card: SrsCard, grade: ReviewGrade, now: number): SrsCard {
  const quality = gradeQuality[grade];
  const easeFactor = Math.max(
    1.3,
    card.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
  );

  if (quality < 3) {
    return {
      repetitions: 0,
      intervalDays: 1,
      easeFactor,
      dueAt: now + 86_400_000,
      lastReviewedAt: now,
    };
  }

  const repetitions = card.repetitions + 1;
  const intervalDays = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(card.intervalDays * easeFactor);
  return {
    repetitions,
    intervalDays,
    easeFactor,
    dueAt: now + intervalDays * 86_400_000,
    lastReviewedAt: now,
  };
}

export function dueCards<T extends { dueAt: number }>(cards: T[], now: number): T[] {
  return cards.filter((card) => card.dueAt <= now);
}
