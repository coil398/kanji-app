import { describe, expect, it } from 'vitest';
import { dueCards, initialCard, reviewCard } from '../src/srs';

const day = 86_400_000;

describe('SM-2 scheduling', () => {
  it('uses one day, six days, then the ease factor to grow intervals', () => {
    const first = reviewCard(initialCard(0), 'good', 0);
    const second = reviewCard(first, 'good', day);
    const third = reviewCard(second, 'good', 7 * day);
    expect(first.intervalDays).toBe(1);
    expect(second.intervalDays).toBe(6);
    expect(third.intervalDays).toBe(15);
    expect(third.easeFactor).toBeCloseTo(2.5);
  });

  it('lapses Again to repetition zero and schedules one day later', () => {
    const card = reviewCard({ ...initialCard(0), repetitions: 4, intervalDays: 18 }, 'again', 10 * day);
    expect(card.repetitions).toBe(0);
    expect(card.intervalDays).toBe(1);
    expect(card.dueAt).toBe(11 * day);
    expect(card.easeFactor).toBe(2.18);
  });

  it('keeps ease at or above 1.3 and applies the grade mapping', () => {
    const difficult = { ...initialCard(0), easeFactor: 1.3, repetitions: 2, intervalDays: 6 };
    expect(reviewCard(difficult, 'hard', day).easeFactor).toBe(1.3);
    expect(reviewCard(difficult, 'easy', day).easeFactor).toBeCloseTo(1.4);
  });

  it('computes due cards against an injected time, including the boundary', () => {
    const cards = [{ id: 'past', dueAt: 99 }, { id: 'now', dueAt: 100 }, { id: 'future', dueAt: 101 }];
    expect(dueCards(cards, 100).map((card) => card.id)).toEqual(['past', 'now']);
  });
});
