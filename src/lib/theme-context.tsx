import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { useColorScheme } from "expo";
import { resolveTheme, type NellaTheme, type ThemeName } from "./theme";

const KEY = "nella.theme";

export function readThemeChoice(): ThemeName {
  // Sync storage read happens inside the component via useEffect below.
  return "system";
}

export function resolveThemeChoice(choice: ThemeName, systemDark: boolean): "light" | "dark" {
  return choice === "system" ? (systemDark ? "dark" : "light") : choice;
}

export function useNellaTheme(): { theme: NellaTheme; choice: ThemeName; setChoice: (next: ThemeName) => void } {
  const systemDark = useColorScheme() === "dark";
  const [choice, setChoiceState] = useState<ThemeName>("system");
  const [resolved, setResolved] = useState<"light" | "dark">(systemDark ? "dark" : "light");

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await SecureStore.getItemAsync(KEY);
        const next = raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
        setChoiceState(next);
        setResolved(resolveThemeChoice(next, systemDark));
      } catch {
        setResolved(resolveThemeChoice("system", systemDark));
      }
    };
    void load();
  }, [systemDark]);

  const setChoice = (next: ThemeName) => {
    setChoiceState(next);
    try {
      void SecureStore.setItemAsync(KEY, next);
    } catch {
      // persist failed; still apply for this visit
    }
    setResolved(resolveThemeChoice(next, systemDark));
  };

  const theme = resolveTheme(resolved === "dark");
  theme.name = choice;

  return { theme, choice, setChoice };
}
