import { useCallback, useState } from 'react';
import { createElement } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { kanji } from '../src/generated/kanji';
import { dueCards } from '../src/srs';
import { readProgress, type Progress } from '../src/progress';
import { colors, Action, Body, Eyebrow, Panel, Screen, SectionTitle, Title, styles } from '../src/ui';
import { createWaitlistSubmission, submitWaitlist as saveWaitlistSubmission } from '../src/waitlist';
import { track } from '../src/analytics';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function HomeScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [email, setEmail] = useState('');
  const [waitlistMessage, setWaitlistMessage] = useState('');
  const [waitlistError, setWaitlistError] = useState('');
  const [payIntent, setPayIntent] = useState<'yes' | 'maybe' | 'no' | null>(null);
  const [waitlistBusy, setWaitlistBusy] = useState(false);
  const now = Date.now();

  useFocusEffect(useCallback(() => { void readProgress().then(setProgress); }, []));
  const learned = kanji.filter((item) => progress[item.char]);
  const due = dueCards(learned.map((item) => ({ char: item.char, dueAt: progress[item.char].card.dueAt })), now);
  const next = kanji.find((item) => !progress[item.char]) ?? kanji[0];

  const submitWaitlist = async () => {
    setWaitlistMessage('');
    if (!emailPattern.test(email.trim())) { setWaitlistError('Enter a valid email address.'); return; }
    setWaitlistError('');
    setWaitlistBusy(true);
    try {
      const payload = await createWaitlistSubmission(email, payIntent);
      await saveWaitlistSubmission(payload);
      try { await track('waitlist_submit', { source: payload.source, pay_intent: payload.pay_intent }); } catch (error) { console.warn('waitlist analytics failed', error); }
      setEmail('');
      setPayIntent(null);
      setWaitlistMessage("Thanks — you're on the list.");
    } catch {
      setWaitlistError('Could not save your email. Try again.');
    } finally { setWaitlistBusy(false); }
  };

  return <Screen>
    <View style={{ gap: 10, paddingTop: 8 }}>
      <Eyebrow>KANJI ORIGINS · LEARN BY SEEING</Eyebrow>
      <Title>Japanese, one shape at a time.</Title>
      <Body>Meet the old idea inside each character. Learn it, try it, then come back when it is due.</Body>
    </View>

    <Panel style={{ backgroundColor: colors.green, borderColor: colors.green, padding: 24 }}>
      <Eyebrow><Text style={{ color: '#d5e7dd' }}>YOUR STUDY DESK</Text></Eyebrow>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <View><Text style={{ color: '#ffffff', fontSize: 30, fontWeight: '800' }}>{learned.length}</Text><Text style={{ color: '#e0eee7' }}>learned</Text></View>
        <View><Text style={{ color: '#ffffff', fontSize: 30, fontWeight: '800' }}>{due.length}</Text><Text style={{ color: '#e0eee7' }}>due today</Text></View>
        <View><Text style={{ color: '#ffffff', fontSize: 30, fontWeight: '800' }}>{kanji.length}</Text><Text style={{ color: '#e0eee7' }}>in this set</Text></View>
      </View>
      <Action label={learned.length === kanji.length ? `Learn again · ${next.char}` : `Learn next · ${next.char}`} onPress={() => router.push(`/kanji/${encodeURIComponent(next.char)}`)} />
      <Action label={`Review · ${due.length} due`} onPress={() => router.push('/review')} secondary disabled={due.length === 0} />
    </Panel>

    <SectionTitle>Start anywhere <Text style={{ color: colors.muted, fontWeight: '500', fontSize: 13 }}>{learned.length}/{kanji.length} learned</Text></SectionTitle>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {kanji.map((item) => {
        const done = Boolean(progress[item.char]);
        return <Pressable key={item.char} accessibilityRole="link" accessibilityLabel={`${item.char}, ${item.meanings[0]}`} onPress={() => router.push(`/kanji/${encodeURIComponent(item.char)}`)} style={({ pressed }) => ({ minWidth: 100, flexGrow: 1, maxWidth: 180, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14, backgroundColor: pressed ? colors.greenPale : colors.card })}>
          <Text style={{ fontSize: 30, fontWeight: '700', color: colors.ink }}>{item.char}</Text>
          <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 13 }}>{item.meanings[0]}</Text>
          <Text style={{ color: done ? colors.green : colors.red, fontSize: 11, fontWeight: '700', marginTop: 6 }}>{done ? 'LEARNED' : 'NEW'}</Text>
        </Pressable>;
      })}
    </View>

    <Panel>
      <Eyebrow>COMING TO IOS</Eyebrow>
      <Text accessibilityRole="header" style={styles.sectionTitle}>Get a launch note</Text>
      <Body>Leave your email to be notified when the iOS app launches.</Body>
      <PlatformForm email={email} setEmail={setEmail} payIntent={payIntent} setPayIntent={setPayIntent} busy={waitlistBusy} submitWaitlist={submitWaitlist} clearError={() => setWaitlistError('')} error={waitlistError} message={waitlistMessage} />
    </Panel>
    <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 12 }}>Free to learn · Progress stays on this device</Text>
  </Screen>;
}

function PlatformForm({ email, setEmail, payIntent, setPayIntent, busy, submitWaitlist, clearError, error, message }: { email: string; setEmail: (value: string) => void; payIntent: 'yes' | 'maybe' | 'no' | null; setPayIntent: (value: 'yes' | 'maybe' | 'no' | null) => void; busy: boolean; submitWaitlist: () => void; clearError: () => void; error: string; message: string }) {
  const inputStyle = { width: '100%', boxSizing: 'border-box', minHeight: 52, border: `1px solid ${error ? colors.red : '#dedbd0'}`, borderRadius: 12, padding: '0 14px', color: colors.ink, fontSize: 16, fontFamily: 'inherit' };
  const field = Platform.OS === 'web'
    ? createElement('input', { id: 'waitlist-email', name: 'email', type: 'email', required: true, maxLength: 254, value: email, placeholder: 'you@example.com', autoComplete: 'email', autoCapitalize: 'none', spellCheck: false, 'aria-invalid': Boolean(error), 'aria-describedby': 'waitlist-status', onChange: (event: { currentTarget: { value: string } }) => { setEmail(event.currentTarget.value); if (error) clearError(); }, style: inputStyle })
    : <TextInput nativeID="waitlist-email" value={email} onChangeText={(value) => { setEmail(value); if (error) clearError(); }} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" accessibilityLabel="Email address" aria-invalid={Boolean(error)} aria-describedby="waitlist-status" maxLength={254} style={{ minHeight: 52, borderWidth: 1, borderColor: error ? colors.red : colors.line, borderRadius: 12, paddingHorizontal: 14, color: colors.ink, fontSize: 16 }} />;
  const options = (['yes', 'maybe', 'no'] as const).map((value) => {
    const label = value === 'yes' ? 'Yes' : value === 'maybe' ? 'Maybe' : 'No';
    return Platform.OS === 'web'
      ? createElement('label', { key: value, style: { display: 'flex', alignItems: 'center', gap: 8, minHeight: 36, color: colors.ink, cursor: 'pointer' } }, createElement('input', { type: 'radio', name: 'pay-intent', value, checked: payIntent === value, onChange: () => setPayIntent(value) }), label)
      : <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: payIntent === value }} onPress={() => setPayIntent(value)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 38 }}><View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: payIntent === value ? colors.green : colors.muted, alignItems: 'center', justifyContent: 'center' }}>{payIntent === value ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green }} /> : null}</View><Text style={{ color: colors.ink }}>{label}</Text></Pressable>;
  });
  const submit = Platform.OS === 'web'
    ? createElement('button', { type: 'submit', disabled: busy, style: { width: '100%', minHeight: 52, border: 0, borderRadius: 14, background: colors.green, color: '#fff', padding: '0 16px', fontSize: 15, fontWeight: 700, cursor: busy ? 'wait' : 'pointer' } }, busy ? 'Saving…' : 'Notify me when the iOS app launches')
    : <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} onPress={submitWaitlist} style={styles.action}><Text style={styles.actionText}>{busy ? 'Saving…' : 'Notify me when the iOS app launches'}</Text></Pressable>;
  const question = Platform.OS === 'web'
    ? createElement('fieldset', { style: { border: 0, padding: 0, margin: '8px 0', color: colors.ink } }, createElement('legend', { style: { fontWeight: 600, marginBottom: 4 } }, 'Would you pay $29.99/year for the full app (N4–N1)?'), ...options)
    : <View accessibilityRole="radiogroup" accessibilityLabel="Would you pay $29.99/year for the full app (N4–N1)?" style={{ gap: 2, marginVertical: 8 }}><Text style={{ color: colors.ink, fontWeight: '600', marginBottom: 4 }}>Would you pay $29.99/year for the full app (N4–N1)?</Text>{options}</View>;
  const fields = <View style={{ gap: 10 }}>{field}{question}{submit}</View>;
  return <View style={{ gap: 8 }}>
    {Platform.OS === 'web' ? createElement('form', { onSubmit: (event: { preventDefault: () => void }) => { event.preventDefault(); submitWaitlist(); }, 'aria-label': 'iOS launch waitlist' }, createElement('label', { htmlFor: 'waitlist-email', style: { display: 'block', marginBottom: 8, color: colors.ink, fontWeight: '600' } }, 'Email address'), fields) : <><Text style={{ color: colors.ink, fontWeight: '600' }}>Email address</Text>{fields}</>}
    <Text nativeID="waitlist-status" accessibilityLiveRegion="polite" style={{ color: error ? colors.red : colors.green }}>{error || message}</Text>
  </View>;
}
