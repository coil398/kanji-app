import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { kanji } from '../../src/generated/kanji';
import { dueCards, reviewCard, type ReviewGrade } from '../../src/srs';
import { readProgress, saveCard, type Progress } from '../../src/progress';
import { recordReviewReturn } from '../../src/analytics';
import { Action, Body, Eyebrow, Panel, Screen, Title, colors } from '../../src/ui';

export default function ReviewScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<[string, Progress][]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    void readProgress().then((all) => {
      const now = Date.now();
      const due = dueCards(Object.entries(all).map(([char, progress]) => ({ char, progress, dueAt: progress.card.dueAt })), now)
        .sort((a, b) => a.dueAt - b.dueAt).map(({ char, progress }) => [char, progress] as [string, Progress]);
      setCards(due);
      void recordReviewReturn(now);
      if (due.length === 0) setComplete(true);
    });
  }, []);
  const current = cards[index];
  const grade = async (value: ReviewGrade) => {
    if (!current) return;
    await saveCard(current[0], reviewCard(current[1].card, value, Date.now()));
    if (index + 1 >= cards.length) setComplete(true);
    else { setIndex(index + 1); setRevealed(false); }
  };

  if (complete) return <Screen>
    <Eyebrow>REVIEW SESSION</Eyebrow>
    <Title>{cards.length ? 'You’re all caught up.' : 'Nothing due yet.'}</Title>
    <Body>{cards.length ? 'Your next reviews are scheduled from today.' : 'Learn a kanji first. It will appear here when it is due.'}</Body>
    <Action label="Back home" onPress={() => router.replace('/')} />
  </Screen>;
  if (!current) return <Screen><Title>Loading reviews…</Title></Screen>;
  const item = kanji.find((entry) => entry.char === current[0]);
  if (!item) return <Screen><Title>This card is unavailable.</Title></Screen>;

  return <Screen>
    <Eyebrow>REVIEW · {index + 1} OF {cards.length}</Eyebrow>
    <Panel style={{ alignItems: 'center', paddingVertical: 32 }}>
      <Text style={{ fontSize: 100, color: colors.ink, fontWeight: '700' }}>{item.char}</Text>
      {revealed ? <View style={{ alignItems: 'center', gap: 8 }}>
        <Text style={{ color: colors.ink, fontSize: 23, textAlign: 'center' }}>{item.meanings.join(' · ')}</Text>
        <Body>{item.on.join(' · ')}　{item.kun.join(' · ')}</Body>
        <View style={{ gap: 9, width: '100%', marginTop: 10 }}>
          {(['again', 'hard', 'good', 'easy'] as const).map((gradeValue) => <Action key={gradeValue} label={gradeValue[0].toUpperCase() + gradeValue.slice(1)} onPress={() => void grade(gradeValue)} secondary={gradeValue !== 'good'} />)}
        </View>
      </View> : <Action label="Reveal meaning" onPress={() => setRevealed(true)} />}
    </Panel>
    <Action label="End session" secondary onPress={() => setComplete(true)} />
  </Screen>;
}
