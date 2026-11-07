import { Pressable, StyleSheet, Text, type TextStyle, View, type ViewStyle } from "react-native";
import type { NellaTheme } from "@/lib/theme";

type ButtonVariant = "default" | "destructive" | "outline" | "ghost" | "secondary" | "link" | "plain";
type ButtonSize = "default" | "icon" | "none";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  theme: NellaTheme;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

const base: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 12,
};

const variantStyles = (theme: NellaTheme, variant: ButtonVariant): ViewStyle => {
  switch (variant) {
    case "default":
      return { backgroundColor: theme.colors.primary };
    case "destructive":
      return { backgroundColor: theme.colors.destructive };
    case "outline":
      return { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background };
    case "ghost":
      return { backgroundColor: "transparent" };
    case "secondary":
      return { backgroundColor: theme.colors.secondary };
    case "link":
      return { backgroundColor: "transparent", paddingHorizontal: 0, paddingVertical: 0 };
    case "plain":
      return { backgroundColor: "transparent" };
    default:
      return { backgroundColor: theme.colors.primary };
  }
};

const variantTextStyles = (theme: NellaTheme, variant: ButtonVariant): TextStyle => {
  switch (variant) {
    case "default":
      return { color: theme.colors.primaryForeground };
    case "destructive":
      return { color: theme.colors.destructiveForeground };
    case "outline":
      return { color: theme.colors.foreground };
    case "ghost":
      return { color: theme.colors.foreground };
    case "secondary":
      return { color: theme.colors.secondaryForeground };
    case "link":
      return { color: theme.colors.primary };
    case "plain":
      return { color: theme.colors.foreground };
    default:
      return { color: theme.colors.primaryForeground };
  }
};

const sizeStyles = (size: ButtonSize): ViewStyle => {
  switch (size) {
    case "icon":
      return { width: 44, height: 44, paddingHorizontal: 0, paddingVertical: 0 };
    case "none":
      return { paddingHorizontal: 0, paddingVertical: 0 };
    case "default":
      return { height: 52, paddingHorizontal: 16 };
    default:
      return { height: 52, paddingHorizontal: 16 };
  }
};

export function Button({
  variant = "default",
  size = "default",
  onPress,
  disabled = false,
  children,
  theme,
  style,
  textStyle,
  testID,
}: ButtonProps) {
  const pressedStyle: ViewStyle = disabled ? { opacity: 0.5 } : {};
  const textPressed: TextStyle = disabled ? { opacity: 0.5 } : {};

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[base, variantStyles(theme, variant), sizeStyles(size), pressedStyle, style]}
      testID={testID}
    >
      <Text style={[variantTextStyles(theme, variant), textPressed, textStyle, { fontFamily: theme.fontFamily }]}>{children}</Text>
    </Pressable>
  );
}
