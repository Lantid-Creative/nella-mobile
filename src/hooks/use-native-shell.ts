import { useEffect } from "react";
import { initBackButton, isNativeShell, syncSystemBars } from "@/lib/native";

/**
 * Wires the native shell: the Android back button and the system bars that
 * follow the app theme. Does nothing in the browser.
 */
export function useNativeShell() {
  useEffect(() => {
    if (!isNativeShell()) return;

    void initBackButton();

    const applyBars = () => {
      const dark = document.documentElement.classList.contains("dark");
      void syncSystemBars(dark);
    };

    applyBars();
    // The theme module announces every change with this event.
    window.addEventListener("nella-theme", applyBars);
    return () => window.removeEventListener("nella-theme", applyBars);
  }, []);
}
