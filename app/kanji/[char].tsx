import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { kanji } from '../../src/generated/kanji';
import { Action, Body, Eyebrow, Panel, Screen, Title, colors } from '../../src/ui';
import OriginVideo from '../../src/OriginVideo';

export default function KanjiDetailScreen() {
  const { char: routeChar } = useLocalSearchParams<{ char: string }>();
  const router = useRouter();
  const item = kanji.find((entry) => entry.char === routeChar);
  if (!item) return <Screen><Title>Kanji not found</Title><Action label="Back home" onPress={() => router.replace('/')} /></Screen>;

  return <Screen>
    <Action label="← All kanji" secondary onPress={() => router.replace('/')} />
    <View style={{ alignItems: 'center', paddingVertical: 4 }}>
      <Eyebrow>{item.jlpt} · ORIGIN STUDY</Eyebrow>
      <Text accessibilityLabel={`Kanji ${item.char}`} style={{ fontSize: 112, lineHeight: 132, fontWeight: '700', color: colors.ink }}>{item.char}</Text>
      <Text style={{ color: colors.muted, fontSize: 17, textTransform: 'capitalize' }}>{item.meanings.join(' · ')}</Text>
    </View>
    <OriginVideo source={item.videoAsset} poster={item.posterAsset} label={`${item.char} origin animation`} />
    <Panel>
      <Eyebrow>THE OLD SHAPE</Eyebrow>
      <Body style={{ color: colors.ink, fontSize: 19, lineHeight: 28 }}>{item.origin.summary_en}</Body>
      <View style={{ gap: 5 }}>
        {item.origin.sources.map((source) => <Text key={`${source.url}-${source.title}`} style={{ color: colors.muted, fontSize: 14 }}>Source: <Link href={source.url} asChild><Text accessibilityRole="link" style={{ color: colors.green, textDecorationLine: 'underline' }}>{source.title}</Text></Link></Text>)}
      </View>
    </Panel>
    <Panel>
      <Eyebrow>READ IT</Eyebrow>
      <Body><Text style={{ color: colors.ink, fontWeight: '700' }}>On:</Text>　{item.on.join(' · ')}</Body>
      <Body><Text style={{ color: colors.ink, fontWeight: '700' }}>Kun:</Text>　{item.kun.join(' · ')}</Body>
    </Panel>
    <Panel>
      <Eyebrow>WORDS TO KNOW</Eyebrow>
      {item.examples.map((example) => <View key={example.word} style={{ borderBottomColor: colors.line, borderBottomWidth: 1, paddingVertical: 8, gap: 2 }}>
        <Text style={{ color: colors.ink, fontSize: 21, fontWeight: '700' }}>{example.word} <Text style={{ color: colors.green, fontSize: 16 }}>{example.reading}</Text></Text>
        <Text style={{ color: colors.muted }}>{example.meaning}</Text>
      </View>)}
    </Panel>
    <Action label="Got it → Quiz" onPress={() => router.push(`/quiz/${encodeURIComponent(item.char)}`)} />
  </Screen>;
}
