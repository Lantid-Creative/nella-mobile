import { useRef, useState, type ReactNode, type PointerEvent } from "react";
import { Copy, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";

export const REACTIONS = ["👍", "❤️", "😂", "🙏", "😮"] as const;
const SWIPE_TRIGGER = 64;

/** Toggles one reaction per customer: picking the same emoji removes it. */
export function toggleReaction(current: string[] | undefined, emoji: string): string[] {
  return current?.includes(emoji) ? [] : [emoji];
}

export function quoteText(text: string | undefined, max = 90) {
  const clean = (text ?? "Attachment").replace(/\s+/g, " ").trim() || "Attachment";
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

type Props = {
  mine: boolean;
  copyText?: string | undefined;
  reactions?: string[] | undefined;
  onReply: () => void;
  onReact: (emoji: string) => void;
  children: ReactNode;
};

/** Swipe right to reply; long-press (or the menu button) to react. */
export function MessageGestures({ mine, copyText, reactions, onReply, onReact, children }: Props) {
  const [dx, setDx] = useState(0);
  const [menu, setMenu] = useState(false);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const horizontal = useRef<boolean | null>(null);
  const press = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearPress = () => { if (press.current) clearTimeout(press.current); press.current = null; };

  const down = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest("button,a,audio,input,[role=option]")) return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    horizontal.current = null;
    clearPress();
    press.current = setTimeout(() => { setMenu(true); navigator.vibrate?.(10); start.current = null; }, 480);
  };
  const move = (e: PointerEvent) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const mx = e.clientX - s.x, my = e.clientY - s.y;
    if (Math.abs(mx) > 8 || Math.abs(my) > 8) clearPress();
    if (horizontal.current === null && (Math.abs(mx) > 10 || Math.abs(my) > 10)) horizontal.current = Math.abs(mx) > Math.abs(my);
    if (horizontal.current) setDx(Math.max(0, Math.min(mx, 96)));
  };
  const up = () => {
    clearPress();
    if (dx >= SWIPE_TRIGGER) { onReply(); navigator.vibrate?.(8); }
    setDx(0); start.current = null; horizontal.current = null;
  };

  return (
    <div className="relative">
      <Reply aria-hidden className="pointer-events-none absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-primary transition-opacity" style={{ opacity: Math.min(dx / SWIPE_TRIGGER, 1) }} />
      <div
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={() => { clearPress(); if (!dx) start.current = null; }}
        onContextMenu={(e) => { e.preventDefault(); setMenu(true); }}
        className="message-swipe touch-pan-y select-none"
        style={{ transform: dx ? `translateX(${dx}px)` : undefined, transition: dx ? "none" : "transform 180ms ease-out" }}
      >
        {children}
      </div>
      {reactions && reactions.length > 0 && (
        <div className={`-mt-1 flex ${mine ? "justify-end" : "justify-start"}`}>
          <Button variant="outline" size="none" onClick={() => onReact(reactions[0]!)} aria-label={`Remove reaction ${reactions[0]}`} className="h-7 min-w-9 rounded-full px-2 text-sm">{reactions.join("")}</Button>
        </div>
      )}
      {menu && (
        <div role="menu" aria-label="Message actions" className={`glass mt-1 flex flex-wrap items-center gap-1 rounded-full border border-border p-1 shadow-lg ${mine ? "ml-auto w-fit" : "w-fit"}`}>
          {REACTIONS.map((r) => (
            <Button key={r} role="menuitem" variant={reactions?.includes(r) ? "secondary" : "ghost"} size="none" aria-label={`React ${r}`} className="h-11 w-11 rounded-full text-xl" onClick={() => { onReact(r); setMenu(false); }}>{r}</Button>
          ))}
          <Button role="menuitem" variant="ghost" size="none" className="h-11 rounded-full px-3 text-sm font-semibold" onClick={() => { onReply(); setMenu(false); }}><Reply className="mr-1 h-4 w-4" />Reply</Button>
          {copyText && <Button role="menuitem" variant="ghost" size="none" className="h-11 rounded-full px-3 text-sm font-semibold" onClick={() => { void navigator.clipboard?.writeText(copyText).catch(() => undefined); setMenu(false); }}><Copy className="mr-1 h-4 w-4" />Copy</Button>}
          <Button role="menuitem" variant="ghost" size="none" aria-label="Close" className="h-11 rounded-full px-3 text-sm text-muted-foreground" onClick={() => setMenu(false)}>✕</Button>
        </div>
      )}
    </div>
  );
}
