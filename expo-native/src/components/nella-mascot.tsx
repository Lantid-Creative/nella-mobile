import { View, StyleSheet } from 'react-native';
import type { NellaTheme } from '@/lib/theme';

interface NellaMascotProps {
  theme: NellaTheme;
  size?: number;
  small?: boolean;
  style?: any;
}

const baseStyles = (theme: NellaTheme) =>
  StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center' },
    head: { position: 'absolute', width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.primary },
    face: { position: 'absolute', width: 32, height: 28, borderRadius: 16, backgroundColor: theme.colors.card },
    eye: { position: 'absolute', width: 5, height: 5, borderRadius: 2.5, backgroundColor: theme.colors.foreground },
    smile: { position: 'absolute', width: 24, height: 12, borderBottomWidth: 3, borderColor: theme.colors.primary, borderStyle: 'solid' },
    ear: { position: 'absolute', width: 12, height: 20, borderRadius: 6, backgroundColor: theme.colors.primary },
    body: { position: 'absolute', width: 48, height: 52, borderRadius: 24, backgroundColor: theme.colors.primary },
    arm: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.primary },
    waveLine: { position: 'absolute', width: 6, height: 2, borderRadius: 1, backgroundColor: theme.colors.primaryForeground },
    cheek: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.accentForeground, opacity: 0.4 },
  });

export function NellaMascot({ theme, size = 140, small = false, style }: NellaMascotProps) {
  const s = baseStyles(theme);
  const d = small ? size / 140 : 1;
  const headTop = size * 0.32;
  const headSize = 52 * d;
  const faceW = 32 * d;
  const faceH = 28 * d;

  return (
    <View style={[ { width: size, height: size }, style ]}>
      <View style={[s.head, { width: headSize, height: headSize, top: headTop, left: (size - headSize) / 2 }]} />
      <View style={[s.face, { width: faceW, height: faceH, top: headTop + (headSize - faceH) / 2, left: (size - faceW) / 2 }]} />
      <View style={[s.eye, { top: headTop + 10 * d, left: (size - faceW) / 2 + 4 * d }]} />
      <View style={[s.eye, { top: headTop + 10 * d, left: (size - faceW) / 2 + faceW - 9 * d }]} />
      <View style={[s.smile, { top: headTop + 24 * d, left: (size - 24 * d) / 2 }]} />
      <View style={[s.ear, { top: headTop + 12 * d, left: (size - headSize) / 2 + 6 * d, width: 12 * d, height: 20 * d, borderRadius: 6 * d }]} />
      <View style={[s.ear, { top: headTop + 12 * d, left: (size - headSize) / 2 + headSize - 18 * d, width: 12 * d, height: 20 * d, borderRadius: 6 * d }]} />
      <View style={[s.body, { width: 48 * d, height: 52 * d, top: size * 0.62, left: (size - 48 * d) / 2 }]} />
      <View style={[s.arm, { top: size * 0.66, left: (size - 48 * d) / 2 - 18 * d, width: 20 * d, height: 20 * d, borderRadius: 10 * d }]} />
      <View style={[s.arm, { top: size * 0.66, left: (size + 48 * d) / 2 - 2 * d, width: 20 * d, height: 20 * d, borderRadius: 10 * d }]} />
      <View style={[s.waveLine, { top: size * 0.72, left: (size - 48 * d) / 2 + 6 * d, width: 6 * d, height: 2 * d }]} />
      <View style={[s.waveLine, { top: size * 0.7, left: (size - 48 * d) / 2 + 14 * d, width: 6 * d, height: 2 * d }]} />
      <View style={[s.cheek, { top: headTop + 28 * d, left: (size - faceW) / 2 - 4 * d }]} />
      <View style={[s.cheek, { top: headTop + 28 * d, left: (size - faceW) / 2 + faceW - 4 * d }]} />
    </View>
  );
}
