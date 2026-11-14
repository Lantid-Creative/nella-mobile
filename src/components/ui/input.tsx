import { TextInput, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import type { NellaTheme } from '@/lib/theme';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  disabled?: boolean;
  theme: NellaTheme;
  style?: ViewStyle;
  textStyle?: TextStyle;
  maxLength?: number;
  autoFocus?: boolean;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  disabled = false,
  theme,
  style,
  textStyle,
  maxLength,
  autoFocus,
}: InputProps) {
  return (
    <TextInput
      style={[
        {
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.input,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          color: theme.colors.foreground,
          fontSize: 16,
          fontFamily: theme.fontFamily,
          minHeight: 52,
        },
        disabled && { opacity: 0.6 },
        style,
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      secureTextEntry={secureTextEntry}
      editable={!disabled}
      maxLength={maxLength}
      autoFocus={autoFocus}
    />
  );
}
