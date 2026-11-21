import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialCard, type SrsCard } from './srs';

export type Progress = { learnedAt: number; card: SrsCard };
const storageKey = '@kanji-origins/progress';

export async function readProgress(): Promise<Record<string, Progress>> {
  const value = await AsyncStorage.getItem(storageKey);
  return value ? JSON.parse(value) as Record<string, Progress> : {};
}

export async function markLearned(char: string, now = Date.now()): Promise<boolean> {
  const progress = await readProgress();
  const isNew = !progress[char];
  if (isNew) progress[char] = { learnedAt: now, card: initialCard(now) };
  await AsyncStorage.setItem(storageKey, JSON.stringify(progress));
  return isNew;
}

export async function saveCard(char: string, card: SrsCard, now = Date.now()): Promise<void> {
  const progress = await readProgress();
  if (!progress[char]) progress[char] = { learnedAt: now, card: initialCard(now) };
  progress[char].card = card;
  await AsyncStorage.setItem(storageKey, JSON.stringify(progress));
}
