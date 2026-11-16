import { useEffect, useRef, useState } from "react";
import type { AppPanel } from "@/lib/app-provisions";

/** UI history only; never use the stored sheet value as account authorization. */
export function useServiceNavigation() {
  const [panel, setPanel] = useState<AppPanel | null>(null);
  const [menu, setMenuState] = useState(false);
  const stack = useRef<(AppPanel | "profile")[]>([]);
  const [depth, setDepth] = useState(0);
  const change = (next: AppPanel | "profile" | null) => {
    if (next === null) {
      const count = stack.current.length;
      stack.current = [];
      setDepth(0);
      setPanel(null);
      setMenuState(false);
      if (count > 0) window.history.go(-count);
      return;
    }
    if (stack.current.at(-1) === next) return;
    stack.current.push(next);
    window.history.pushState(
      { ...window.history.state, nellaSheetDepth: stack.current.length },
      "",
    );
    setDepth(stack.current.length);
    setPanel(next === "profile" ? null : next);
    setMenuState(next === "profile");
  };
  const back = () => {
    if (stack.current.length > 0) window.history.back();
  };
  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const target =
        typeof event.state?.nellaSheetDepth === "number" ? event.state.nellaSheetDepth : 0;
      stack.current = stack.current.slice(0, target);
      const next = stack.current.at(-1);
      setDepth(stack.current.length);
      setPanel(next && next !== "profile" ? next : null);
      setMenuState(next === "profile");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const setMenu = (open: boolean) => change(open ? "profile" : null);
  return { panel, change, back, depth, menu, setMenu };
}
