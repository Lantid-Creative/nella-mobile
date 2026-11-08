import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Mic } from 'lucide-react-native';
import type { NellaTheme } from '@/lib/theme';

interface VoiceNoteControlProps {
  theme: NellaTheme;
  mode: 'idle' | 'recording' | 'review';
  onPressStart: () => void;
  onPressStop: () => void;
  onPressCancel: () => void;
}

export function VoiceNoteControl({ theme, mode, onPressStart, onPressStop, onPressCancel }: VoiceNoteControlProps) {
  const s = createStyles(theme);
  const isRecording = mode === 'recording' || mode === 'review';
  return (
    <TouchableOpacity
      style={[s.button, isRecording ? s.buttonRecording : s.buttonIdle]}
      disabled={mode === 'review'}
      onPress={mode === 'recording' ? onPressStop : onPressStart}
      activeOpacity={0.8}
    >
      <Mic size={20} strokeWidth={2} style={{ color: isRecording ? theme.colors.destructiveForeground : theme.colors.primaryForeground }} />
    </TouchableOpacity>
  );
}

function createStyles(theme: NellaTheme) {
  return StyleSheet.create({
    button: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    buttonIdle: { backgroundColor: theme.colors.primary },
    buttonRecording: { backgroundColor: theme.colors.destructive },
  });
}
