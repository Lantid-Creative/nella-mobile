import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, LogOut, RotateCcw } from "lucide-react";
import {
  currentUser, demoReply, loadChat, saveChat, signOut,
  type ChatMsg, type DemoUser,
} from "@/lib/demo-store";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Nella Chat" },
      { name: "description", content: "Chat with Nella to send money, pay bills and check your balance." },
      { property: "og:title", content: "Nella Chat" },
      { property: "og:description", content: "Chat with Nella to send money, pay bills and check your balance." },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = ["Check my balance", "Send money", "Buy airtime", "Pay a bill"];

function ChatPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<DemoUser | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [menu, setMenu] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const u = currentUser();
    if (!u) { navigate({ to: "/", replace: true }); return; }
    setUser(u);
    setMsgs(loadChat(u.email));
    inputRef.current?.focus();
  }, [navigate]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  const update = (next: ChatMsg[]) => { setMsgs(next); if (user) saveChat(user.email, next); };

  const send = (raw: string) => {
    const t = raw.trim();
    if (!t || typing || !user) return;
    const mine: ChatMsg = { id: crypto.randomUUID(), role: "user", text: t, at: Date.now() };
    const withMine = [...msgs, mine];
    update(withMine);
    setText("");
    setTyping(true);
    setTimeout(() => {
      update([...withMine, { id: crypto.randomUUID(), role: "nella", text: demoReply(t), at: Date.now() }]);
      setTyping(false);
      inputRef.current?.focus();
    }, 900);
  };

  const onSubmit = (e: FormEvent) => { e.preventDefault(); send(text); };

  if (!user) return <div className="min-h-screen bg-background" />;
  const first = user.name.split(" ")[0];
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const empty = msgs.length === 0;

  return (
    <div className="bg-hero flex h-screen flex-col">
      <header className="relative flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="bg-orb h-8 w-8 rounded-full" />
          <span className="text-lg font-extrabold tracking-tight">Nella</span>
        </div>
        <button
          onClick={() => setMenu((m) => !m)}
          aria-label="Profile"
          className="glass flex h-10 w-10 items-center justify-center rounded-full border border-border text-sm font-bold"
        >
          {initials}
        </button>
        {menu && (
          <div className="glass absolute right-5 top-16 z-10 w-60 rounded-2xl border border-border p-4 shadow-glow">
            <p className="font-bold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <div className="my-3 h-px bg-border" />
            <button onClick={() => { update([]); setMenu(false); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-accent">
              <RotateCcw className="h-4 w-4" /> Clear chat
            </button>
            <button onClick={() => { signOut(); navigate({ to: "/", replace: true }); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-destructive hover:bg-accent">
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5" onClick={() => setMenu(false)}>
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="relative mb-10 flex items-center justify-center">
              <div className="absolute h-48 w-48 rounded-full border border-border bg-primary/5" />
              <div className="absolute h-32 w-32 rounded-full border border-border bg-primary/10" />
              <div className="bg-orb shadow-glow h-20 w-20 rounded-full" />
            </div>
            <p className="text-muted-foreground">Hi, {first}!</p>
            <h1 className="mt-1 text-2xl font-bold">How can I help you today?</h1>
            <div className="mt-8 grid w-full max-w-sm grid-cols-2 gap-3">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="glass rounded-2xl border border-border px-4 py-4 text-left text-sm font-semibold hover:bg-accent">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start gap-2"}`}>
                {m.role === "nella" && <div className="bg-orb mt-1 h-7 w-7 shrink-0 rounded-full" />}
                <div
                  className={`max-w-[80%] whitespace-pre-wrap px-4 py-3 text-[15px] leading-relaxed ${
                    m.role === "user"
                      ? "rounded-2xl rounded-br-sm bg-primary text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex items-center gap-2">
                <div className="bg-orb h-7 w-7 rounded-full" />
                <div className="glass flex gap-1 rounded-full px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-primary-glow" style={{ animationDelay: `${i * 120}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </main>

      <form onSubmit={onSubmit} className="mx-auto w-full max-w-2xl px-5 pb-6 pt-2">
        <div className="glass flex items-end gap-2 rounded-3xl border border-border p-2 pl-4">
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
            placeholder="Message Nella…"
            className="max-h-32 flex-1 resize-none bg-transparent py-2 text-[15px] text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim() || typing}
            aria-label="Send"
            className="shadow-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
