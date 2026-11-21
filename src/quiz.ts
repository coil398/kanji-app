export type QuizKanji = {
  char: string;
  meanings: string[];
  on: string[];
  kun: string[];
  examples: { word: string; reading: string; meaning: string; source_url?: string }[];
};

export type QuizQuestion = {
  kind: 'reading' | 'meaning-to-kanji';
  prompt: string;
  options: string[];
  correctAnswer: string;
  kanji: string;
};

function seededIndex(seed: number, max: number): number {
  let value = seed | 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) % max;
}

export function generateQuiz(
  kanji: QuizKanji[],
  targetChar: string,
  kind: QuizQuestion['kind'],
  seed = 1,
): QuizQuestion {
  const target = kanji.find((item) => item.char === targetChar);
  if (!target) throw new Error(`Unknown kanji: ${targetChar}`);
  const distractors = kanji.filter((item) => item.char !== targetChar);
  if (distractors.length < 3) throw new Error('At least three other kanji are required.');

  if (kind === 'meaning-to-kanji') {
    const correctMeaning = target.meanings[seededIndex(seed, target.meanings.length)];
    const selected = distractors.slice().sort((a, b) => a.char < b.char ? -1 : a.char > b.char ? 1 : 0).slice(0, 3).map((item) => item.char);
    const options = [target.char, ...selected].sort();
    return { kind, prompt: `Choose the kanji meaning “${correctMeaning}”.`, options, correctAnswer: target.char, kanji: targetChar };
  }

  const example = target.examples[seededIndex(seed, target.examples.length)];
  const otherReadings = [...new Set(distractors.flatMap((item) => [...item.on, ...item.kun, ...item.examples.map((word) => word.reading)]))]
    .filter((reading) => reading !== example.reading && ![...target.on, ...target.kun].includes(reading))
    .sort();
  if (otherReadings.length < 3) throw new Error('At least three distinct distractor readings are required.');
  const picks = seededIndex(seed, otherReadings.length);
  const wrong = [0, 1, 2].map((offset) => otherReadings[(picks + offset) % otherReadings.length]);
  const options = [example.reading, ...wrong].sort();
  return {
    kind,
    prompt: `How do you read ${example.word} (${example.meaning})?`,
    options,
    correctAnswer: example.reading,
    kanji: targetChar,
  };
}
