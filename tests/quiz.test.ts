import { describe, expect, it } from 'vitest';
import { generateQuiz, type QuizKanji } from '../src/quiz';

const dataset: QuizKanji[] = [
  { char: '日', meanings: ['sun'], on: ['ニチ'], kun: ['ひ'], examples: [{ word: '日曜日', reading: 'にちようび', meaning: 'Sunday' }] },
  { char: '月', meanings: ['moon'], on: ['ゲツ'], kun: ['つき'], examples: [{ word: '月曜日', reading: 'げつようび', meaning: 'Monday' }] },
  { char: '山', meanings: ['mountain'], on: ['サン'], kun: ['やま'], examples: [{ word: '山', reading: 'やま', meaning: 'mountain' }] },
  { char: '川', meanings: ['river'], on: ['セン'], kun: ['かわ'], examples: [{ word: '川', reading: 'かわ', meaning: 'river' }] },
  { char: '火', meanings: ['fire'], on: ['カ'], kun: ['ひ'], examples: [{ word: '火曜日', reading: 'かようび', meaning: 'Tuesday' }] },
];

describe('quiz generation', () => {
  it.each(['reading', 'meaning-to-kanji'] as const)('makes a four-option %s question with one correct answer', (kind) => {
    const question = generateQuiz(dataset, '日', kind, 17);
    expect(question.options).toHaveLength(4);
    expect(new Set(question.options).size).toBe(4);
    expect(question.options.filter((option) => option === question.correctAnswer)).toHaveLength(1);
    expect(question.options.every((option) => option !== undefined)).toBe(true);
    expect(question.options).not.toContain(undefined);
    if (kind === 'reading') {
      expect(question.options.filter((option) => option !== question.correctAnswer)).not.toContain('日');
      expect(question.options.filter((option) => option !== question.correctAnswer)).not.toContain('ニチ');
    } else {
      expect(question.options.filter((option) => option !== question.correctAnswer)).not.toContain('日');
    }
  });

  it('returns the same question for the same seed', () => {
    expect(generateQuiz(dataset, '日', 'reading', 22)).toEqual(generateQuiz(dataset, '日', 'reading', 22));
  });
});
