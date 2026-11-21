import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/ui';
import { recordVisit } from '../src/analytics';

export default function RootLayout() {
  useEffect(() => { void recordVisit(); }, []);
  return <>
    <StatusBar style="dark" />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} />
  </>;
}
