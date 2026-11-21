import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export const colors = {
  paper: '#f6f3eb', card: '#fffdf8', ink: '#1e2927', muted: '#62716b', line: '#dedbd0',
  green: '#1f6452', greenPale: '#e1eee7', red: '#c45d45', gold: '#d8a74a', white: '#ffffff',
};

export function Screen({ children }: PropsWithChildren) {
  return <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled"><View style={styles.content}>{children}</View></ScrollView>;
}

export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Title({ children }: PropsWithChildren) {
  return <Text accessibilityRole="header" style={styles.title}>{children}</Text>;
}

export function Body({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Action({ label, onPress, secondary = false, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.action, secondary && styles.actionSecondary, disabled && styles.disabled, pressed && !disabled && styles.pressed]}>
    <Text style={[styles.actionText, secondary && styles.actionTextSecondary]}>{label}</Text>
  </Pressable>;
}

export function Panel({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: PropsWithChildren<{ right?: ReactNode }>) {
  return <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{children}</Text>{right}</View>;
}

export const styles = StyleSheet.create({
  screen: { flexGrow: 1, backgroundColor: colors.paper, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 52 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 18 },
  eyebrow: { color: colors.green, fontSize: 12, fontWeight: '800', letterSpacing: 2.1, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -0.8 },
  body: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  panel: { backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, borderRadius: 20, padding: 20, gap: 12 },
  action: { minHeight: 52, borderRadius: 14, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  actionSecondary: { backgroundColor: colors.greenPale },
  actionText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  actionTextSecondary: { color: colors.green },
  disabled: { opacity: 0.45 }, pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
});
