import { VideoView, useVideoPlayer } from 'expo-video';
import { StyleSheet } from 'react-native';

export default function OriginVideo({ source, label }: { source: number | string; poster: number | string; label: string }) {
  const player = useVideoPlayer(source, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.play();
  });
  return <VideoView player={player} contentFit="cover" nativeControls={false} accessibilityLabel={label} style={styles.video} />;
}

const styles = StyleSheet.create({ video: { width: '100%', maxWidth: 520, aspectRatio: 1, alignSelf: 'center', borderRadius: 20 } });
