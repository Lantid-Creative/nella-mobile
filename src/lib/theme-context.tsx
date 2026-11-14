// @ts-nocheck
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { resolveTheme, type NellaTheme, type ThemeName } from './theme';

const KEY = 'nella.theme';

export function readThemeChoice(): ThemeName {
  return 'system';
}

export function resolveThemeChoice(choice: ThemeName, systemDark: boolean): 'light' | 'dark' {
  return choice === 'system' ? (systemDark ? 'dark' : 'light') : choice;
}

export function useNellaTheme(): { theme: NellaTheme; choice: ThemeName; setChoice: (next: ThemeName) => void } {
  const [choice, setChoiceState] = useState<ThemeName>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await SecureStore.getItemAsync(KEY);
        const next = raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
        setChoiceState(next);
        setResolved(resolveThemeChoice(next, false));
      } catch {
        setResolved(resolveThemeChoice('system', false));
      }
    };
    void load();
  }, []);

  const setChoice = (next: ThemeName) => {
    setChoiceState(next);
    try {
      void SecureStore.setItemAsync(KEY, next);
    } catch {
      // persist failed; still apply for this visit
    }
    setResolved(resolveThemeChoice(next, false));
  };

  const theme = resolveTheme(resolved === 'dark');
  theme.name = choice;

  return { theme, choice, setChoice };
}
