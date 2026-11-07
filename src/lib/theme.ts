// Theme tokens ported from the web app's styles.css (oklch values).
// React Native doesn't support oklch natively, so these are hex approximations
// that preserve the Nella visual language: indigo primary, slate surfaces.

export type ThemeName = "light" | "dark" | "system";

export interface NellaTheme {
  name: ThemeName;
  dark: boolean;
  fontFamily: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    primaryGlow: string;
    primaryDeep: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
    sidebar: string;
    sidebarForeground: string;
    sidebarPrimary: string;
    sidebarPrimaryForeground: string;
    sidebarAccent: string;
    sidebarAccentForeground: string;
    sidebarBorder: string;
    sidebarRing: string;
    gradientHero: string;
    shadowGlow: string;
  };
}

const LIGHT: NellaTheme["colors"] = {
  background: "#F8F9FC",
  foreground: "#1E1B4B",
  card: "#FFFFFF",
  cardForeground: "#1E1B4B",
  popover: "#FFFFFF",
  popoverForeground: "#1E1B4B",
  primary: "#6366F1",
  primaryForeground: "#FFFFFF",
  primaryGlow: "#4F46E5",
  primaryDeep: "#4338CA",
  secondary: "#F1F5F9",
  secondaryForeground: "#1E1B4B",
  muted: "#F3F4F6",
  mutedForeground: "#6B7280",
  accent: "#EEF2FF",
  accentForeground: "#1E1B4B",
  destructive: "#DC2626",
  destructiveForeground: "#FFFFFF",
  border: "#E5E7EB",
  input: "#D1D5DB",
  ring: "#6366F1",
  sidebar: "#1E1B4B",
  sidebarForeground: "#F9FAFB",
  sidebarPrimary: "#6366F1",
  sidebarPrimaryForeground: "#FFFFFF",
  sidebarAccent: "#2D2B5C",
  sidebarAccentForeground: "#F9FAFB",
  sidebarBorder: "rgba(255, 255, 255, 0.1)",
  sidebarRing: "#6366F1",
  gradientHero: "linear-gradient(180deg, #F1F5F9, #F8F9FC 48%)",
  shadowGlow: "0 8px 24px -10px rgba(99, 102, 241, 0.25)",
};

const DARK: NellaTheme["colors"] = {
  background: "#0F172A",
  foreground: "#F9FAFB",
  card: "#1E1B4B",
  cardForeground: "#F9FAFB",
  popover: "#1E1B4B",
  popoverForeground: "#F9FAFB",
  primary: "#818CF8",
  primaryForeground: "#FFFFFF",
  primaryGlow: "#6366F1",
  primaryDeep: "#4338CA",
  secondary: "#27275C",
  secondaryForeground: "#F9FAFB",
  muted: "#1E1B4B",
  mutedForeground: "#A1A1AA",
  accent: "#27275C",
  accentForeground: "#F9FAFB",
  destructive: "#DC2626",
  destructiveForeground: "#FFFFFF",
  border: "#27275C",
  input: "#2D2B5C",
  ring: "#818CF8",
  sidebar: "#1E1B4B",
  sidebarForeground: "#F9FAFB",
  sidebarPrimary: "#818CF8",
  sidebarPrimaryForeground: "#FFFFFF",
  sidebarAccent: "#37306B",
  sidebarAccentForeground: "#F9FAFB",
  sidebarBorder: "rgba(255, 255, 255, 0.1)",
  sidebarRing: "#818CF8",
  gradientHero: "linear-gradient(180deg, #27275C, #0F172A 48%)",
  shadowGlow: "0 8px 24px -10px rgba(129, 140, 248, 0.25)",
};

const FONT_FAMILY = "PlusJakartaSans";

export function resolveColors(dark: boolean): NellaTheme["colors"] {
  return dark ? DARK : LIGHT;
}

export function resolveTheme(dark: boolean): NellaTheme {
  return {
    name: dark ? "dark" : "light",
    dark,
    fontFamily: FONT_FAMILY,
    colors: resolveColors(dark),
  };
}
