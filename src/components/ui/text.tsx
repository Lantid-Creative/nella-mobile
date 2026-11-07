import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from "react-native";
import type { NellaTheme } from "@/lib/theme";

interface TextProps {
  children: React.ReactNode;
  theme: NellaTheme;
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: "foreground" | "muted" | "primary" | "destructive" | "accent";
}

export function TextC({ children, theme, className, style, textStyle, variant = "foreground" }: TextProps) {
  const colorMap: Record<string, string> = {
    foreground: theme.colors.foreground,
    muted: theme.colors.mutedForeground,
    primary: theme.colors.primary,
    destructive: theme.colors.destructive,
    accent: theme.colors.accentForeground,
  };
  return (
    <Text style={[style, { color: colorMap[variant], fontFamily: theme.fontFamily }, textStyle]}>{children}</Text>
  );
}

export const cn = (...inputs: (string | undefined | null | false)[]) => inputs.filter(Boolean).join(" ");
