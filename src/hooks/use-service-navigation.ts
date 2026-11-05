import { useEffect, useRef, useState } from "react";
import type { AppPanel } from "@/lib/app-provisions";

/** UI history only; never use the stored sheet value as account authorization. */
export function useServiceNavigation() {
  const [panel, setPanel] = useState<AppPanel | null>(null);
  const stack = useRef<AppPanel[]>([]);
  const [depth, setDepth] = useState(0);
  const change = (next: AppPanel | null) => {
    if (next === null) {
      const count = stack.current.length;
      stack.current = []; setDepth(0); setPanel(null);
      if (count > 0) window.history.go(-count);
      return;
    }
    if (stack.current.at(-1) === next) return;
    stack.current.push(next);
    window.history.pushState({ ...window.history.state, nellaSheetDepth: stack.current.length }, "");
    setDepth(stack.current.length); setPanel(next);
  };
  const back = () => { if (stack.current.length > 0) window.history.back(); };
  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const target = typeof event.state?.nellaSheetDepth === "number" ? event.state.nellaSheetDepth : 0;
      stack.current = stack.current.slice(0, target);
      setDepth(stack.current.length); setPanel(stack.current.at(-1) ?? null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return { panel, change, back, depth };
}