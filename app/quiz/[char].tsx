import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { kanji } from '../../src/generated/kanji';
import { generateQuiz } from '../../src/quiz';
import { markLearned } from '../../src/progress';
import { track } from '../../src/analytics';
import { Action, Body, Eyebrow, Panel, Screen, Title, colors } from '../../src/ui';

export default function QuizScreen() {
  const { char = '' } = useLocalSearchParams<{ char: string }>();
  const router = useRouter();
  const questions = useMemo(() => [
    generateQuiz(kanji, char, 'reading', 13),
    generateQuiz(kanji, char, 'meaning-to-kanji', 29),
  ], [char]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const question = questions[index];
  const complete = async () => {
    if (await markLearned(char)) await track('kanji_learned', { kanji: char });
    setFinished(true);
  };
  const choose = async (option: string) => {
    if (answer) return;
    setAnswer(option);
    const correct = option === question.correctAnswer;
    if (correct) setScore((count) => count + 1);
    await track('quiz_answer', { kanji: char, correct });
  };
  const next = () => {
    if (index + 1 === questions.length) void complete();
    else { setIndex(index + 1); setAnswer(null); }
  };

  if (finished) return <Screen>
    <Eyebrow>SESSION COMPLETE</Eyebrow>
    <Title>{char} is learned.</Title>
    <Body>You got {score} of {questions.length} right. It is now in your review schedule.</Body>
    <Action label="Back to my kanji" onPress={() => router.replace('/')} />
    <Action label="Review due cards" onPress={() => router.replace('/review')} secondary />
  </Screen>;

  return <Screen>
    <Eyebrow>QUICK CHECK · {index + 1} OF {questions.length}</Eyebrow>
    <Title>Choose the right answer.</Title>
    <Panel>
      <Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 22, fontWeight: '700' }}>{question.prompt}</Text>
      {questions[index].options.map((option) => {
        const correct = answer && option === question.correctAnswer;
        return <Action key={option} label={option} onPress={() => void choose(option)} secondary={!correct} disabled={Boolean(answer)} />;
      })}
      {answer && <>
        <Body style={{ color: answer === question.correctAnswer ? colors.green : colors.red, fontWeight: '700' }}>{answer === question.correctAnswer ? 'That’s right.' : `The answer is ${question.correctAnswer}.`}</Body>
        <Action label={index + 1 === questions.length ? 'Finish quiz' : 'Next question'} onPress={next} />
      </>}
    </Panel>
    <Action label="Leave quiz" secondary onPress={() => router.back()} />
  </Screen>;
}
