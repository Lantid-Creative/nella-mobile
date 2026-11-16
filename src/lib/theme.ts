import { useEffect, useState } from "react";

export type ThemeChoice = "light" | "dark" | "system";
const KEY = "nella.theme";

export function readThemeChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
}

export function resolveTheme(choice: ThemeChoice, systemDark: boolean): "light" | "dark" {
  return choice === "system" ? (systemDark ? "dark" : "light") : choice;
}

function apply(choice: ThemeChoice) {
  const dark =
    resolveTheme(choice, window.matchMedia("(prefers-color-scheme: dark)").matches) === "dark";
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  window.dispatchEvent(new CustomEvent("nella-theme"));
}

/** Runs once in the app shell: applies the saved choice and follows phone settings in system mode. */
export function useThemeSync() {
  useEffect(() => {
    apply(readThemeChoice());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readThemeChoice() === "system") apply("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
}

export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>("system");
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const sync = () => {
      setChoice(readThemeChoice());
      setDark(document.documentElement.classList.contains("dark"));
    };
    sync();
    window.addEventListener("nella-theme", sync);
    return () => window.removeEventListener("nella-theme", sync);
  }, []);
  const set = (next: ThemeChoice) => {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* still apply for this visit */
    }
    apply(next);
  };
  return { choice, dark, setChoice: set };
}

/** Inline script for <head> so the right theme shows before the page paints. */
export const themeBootScript = `try{var c=localStorage.getItem("${KEY}");var d=c==="dark"||((!c||c==="system")&&matchMedia("(prefers-color-scheme: dark)").matches);if(d){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark"}}catch(e){}`;
