import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, Camera, LogOut, Mic, RotateCcw, ShieldCheck, X } from "lucide-react";
import {
  checkPin, currentUser, demoReply, loadChat, naira, saveChat, signOut,
  type ApprovalCard, type ChatMsg, type DemoUser,
} from "@/lib/demo-store";
import avatar from "@/assets/nella-avatar.jpg.asset.json";
import logo from "@/assets/nella-footer-logo.png.asset.json";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat with Nella" },
      { name: "description", content: "Send money, buy airtime and data, pay bills and check your balance by chatting with Nella." },
      { property: "og:title", content: "Chat with Nella" },
      { property: "og:description", content: "Send money, buy airtime and data, pay bills and check your balance by chatting with Nella." },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = ["Check my balance", "Send money", "Buy airtime", "Pay a bill"];
const NARRATIONS = ["Rent", "Food", "Family", "Business"];
const uid = () => crypto.randomUUID();

function ChatPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<DemoUser | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [menu, setMenu] = useState(false);
  const [pinFor, setPinFor] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const msgsRef = useRef<ChatMsg[]>([]);

  useEffect(() => {
    const u = currentUser();
    if (!u) { navigate({ to: "/", replace: true }); return; }
    setUser(u);
    const m = loadChat(u.phone);
    msgsRef.current = m;
    setMsgs(m);
    inputRef.current?.focus();
  }, [navigate]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  const commit = (next: ChatMsg[]) => {
    msgsRef.current = next;
    setMsgs(next);
    if (user) saveChat(user.phone, next);
  };
  const nellaSays = (parts: Omit<ChatMsg, "id" | "at" | "role">[], delay = 800) => {
    setTyping(true);
    setTimeout(() => {
      commit([...msgsRef.current, ...parts.map((p) => ({ ...p, id: uid(), role: "nella" as const, at: Date.now() }))]);
      setTyping(false);
      inputRef.current?.focus();
    }, delay);
  };
  const patch = (id: string, fn: (m: ChatMsg) => ChatMsg) => commit(msgsRef.current.map((m) => (m.id === id ? fn(m) : m)));

  const send = (raw: string) => {
    const t = raw.trim();
    if (!t || typing || !user) return;
    commit([...msgsRef.current, { id: uid(), role: "user", text: t, at: Date.now() }]);
    setText("");
    nellaSays(demoReply(t));
  };

  const pickNarration = (msgId: string, pending: ApprovalCard, choice: string | null) => {
    patch(msgId, (m) => (m.card?.kind === "narration" ? { ...m, card: { ...m.card, done: true } } : m));
    if (choice) commit([...msgsRef.current, { id: uid(), role: "user", text: choice, at: Date.now() }]);
    nellaSays([{ text: "Please check and approve:", card: { ...pending, narration: choice ?? undefined } }], 500);
  };

  const onPinOk = () => {
    const id = pinFor!;
    setPinFor(null);
    const msg = msgsRef.current.find((m) => m.id === id);
    if (!msg || msg.card?.kind !== "approval") return;
    const c = msg.card;
    patch(id, (m) => ({ ...m, card: { ...c, status: "approved" } }));
    nellaSays([{ text: "Sending…" }], 300);
    const title = c.service === "transfer" ? "Money sent" : c.service === "airtime" ? "Airtime bought" : "Data bought";
    nellaSays([{
      card: {
        kind: "receipt", title, amount: c.amount,
        rows: c.service === "transfer"
          ? [["Bank", c.bank], ["Account", c.account], ...(c.narration ? [["For", c.narration] as [string, string]] : [])]
          : [["Phone", c.account], ["Network", c.bank]],
      },
    }], 1600);
  };

  if (!user) return <div className="min-h-screen bg-background" />;
  const first = user.name.split(" ")[0];
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const empty = msgs.length === 0;

  return (
    <div className="bg-hero flex h-screen flex-col">
      <header className="relative flex items-center justify-between px-5 py-4">
        <img src={logo.url} alt="Nella" className="h-7 w-auto" />
        <button onClick={() => setMenu((m) => !m)} aria-label="Profile"
          className="glass flex h-10 w-10 items-center justify-center rounded-full border border-border text-sm font-bold">
          {initials}
        </button>
        {menu && (
          <div className="glass absolute right-5 top-16 z-20 w-64 rounded-2xl border border-border p-4 shadow-glow">
            <p className="font-bold">{user.name}</p>
            <p className="text-xs text-muted-foreground">+234 {user.phone}</p>
            <div className="my-3 h-px bg-border" />
            <button onClick={() => { commit([]); setMenu(false); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-accent">
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
              <img src={avatar.url} alt="Nella" className="shadow-glow h-20 w-20 rounded-full object-cover" />
            </div>
            <p className="text-muted-foreground">Hi, {first}!</p>
            <h1 className="mt-1 text-2xl font-bold">What would you like to do today?</h1>
            <div className="mt-8 grid w-full max-w-sm grid-cols-2 gap-3">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="glass rounded-2xl border border-border px-4 py-4 text-left text-sm font-semibold hover:bg-accent">{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start gap-2"}`}>
                {m.role === "nella" && <img src={avatar.url} alt="" className="mt-1 h-7 w-7 shrink-0 rounded-full object-cover" />}
                <div className="max-w-[85%] space-y-2">
                  {m.text && (
                    <div className={`whitespace-pre-wrap text-[15px] leading-relaxed ${m.role === "user" ? "rounded-[20px] rounded-br-[4px] bg-primary px-4 py-3 text-primary-foreground" : "px-1 py-1 text-foreground"}`}>
                      {m.text}
                    </div>
                  )}
                  {m.card?.kind === "balance" && (
                    <div className="rounded-[28px] bg-primary p-5 text-primary-foreground shadow-glow">
                      <p className="text-xs opacity-80">Nella wallet</p>
                      <p className="mt-1 text-3xl font-extrabold tabular-nums">{m.card.amount}</p>
                      <p className="mt-3 text-[11px] opacity-70">Illustrative figure in this preview</p>
                    </div>
                  )}
                  {m.card?.kind === "narration" && !m.card.done && (() => {
                    const c = m.card;
                    return (
                      <div className="flex flex-wrap gap-2">
                        {NARRATIONS.map((n) => (
                          <button key={n} onClick={() => pickNarration(m.id, c.pending, n)} className="glass rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-accent">{n}</button>
                        ))}
                        <button onClick={() => pickNarration(m.id, c.pending, null)} className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent">Skip</button>
                      </div>
                    );
                  })()}
                  {m.card?.kind === "approval" && (
                    <div className="glass rounded-[28px] border border-border p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {m.card.service === "transfer" ? "Send money" : m.card.service === "airtime" ? "Buy airtime" : "Buy data"}
                      </p>
                      <p className="mt-1 text-2xl font-extrabold tabular-nums">{naira(m.card.amount)}</p>
                      <dl className="mt-3 space-y-1 text-sm">
                        <Row k={m.card.service === "transfer" ? "Account" : "Phone"} v={m.card.account} />
                        <Row k={m.card.service === "transfer" ? "Bank" : "Network"} v={m.card.bank} />
                        {m.card.narration && <Row k="For" v={m.card.narration} />}
                      </dl>
                      {m.card.status === "pending" ? (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button onClick={() => patch(m.id, (x) => ({ ...x, card: { ...(x.card as ApprovalCard), status: "cancelled" } }))}
                            className="rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-accent">Cancel</button>
                          <button onClick={() => setPinFor(m.id)} className="rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground"
                            style={{ boxShadow: "var(--shadow-lip)" }}>Approve</button>
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-muted-foreground">{m.card.status === "approved" ? "Approved with PIN" : "Cancelled — nothing was sent"}</p>
                      )}
                    </div>
                  )}
                  {m.card?.kind === "receipt" && (
                    <div className="rounded-[28px] bg-card p-5 text-card-foreground">
                      <div className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-4 w-4 text-primary-glow" /> {m.card.title}</div>
                      <p className="mt-2 text-2xl font-extrabold tabular-nums">{naira(m.card.amount)}</p>
                      <dl className="mt-3 space-y-1 text-sm">{m.card.rows.map(([k, v]) => <Row key={k} k={k} v={v} />)}</dl>
                      <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-[11px] text-muted-foreground">Preview receipt — no real money moved.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex items-center gap-2">
                <img src={avatar.url} alt="" className="h-7 w-7 rounded-full object-cover" />
                <div className="glass flex gap-1 rounded-full px-4 py-3">
                  {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-primary-glow" style={{ animationDelay: `${i * 120}ms` }} />)}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </main>

      <form onSubmit={(e: FormEvent) => { e.preventDefault(); send(text); }} className="mx-auto w-full max-w-2xl px-5 pb-6 pt-2">
        <div className="glass flex items-end gap-1 rounded-3xl border border-border p-2 pl-2">
          <button type="button" aria-label="Snap to pay (coming soon)" title="Snap to pay — coming soon" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent">
            <Camera className="h-5 w-5" />
          </button>
          <textarea ref={inputRef} rows={1} value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
            placeholder="Message Nella…"
            className="max-h-32 flex-1 resize-none bg-transparent px-1 py-2 text-[15px] text-foreground placeholder:text-muted-foreground outline-none" />
          {text.trim() ? (
            <button type="submit" disabled={typing} aria-label="Send" className="shadow-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40">
              <ArrowUp className="h-5 w-5" />
            </button>
          ) : (
            <button type="button" aria-label="Voice note (coming soon)" title="Voice notes — coming soon" className="shadow-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Mic className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      {pinFor && <PinSheet user={user} onClose={() => setPinFor(null)} onOk={onPinOk} />}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>;
}

function PinSheet({ user, onClose, onOk }: { user: DemoUser; onClose: () => void; onOk: () => void }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const press = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setErr("");
    if (next.length === 4) {
      if (checkPin(user, next)) setTimeout(onOk, 150);
      else { setErr("Wrong PIN. Try again."); setTimeout(() => setPin(""), 300); }
    }
  };
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-[28px] border border-border bg-card p-6 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="font-bold">Enter your PIN</p>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-accent"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Secure screen — your PIN is never shared in chat.</p>
        <div className="my-6 flex justify-center gap-4">
          {[0, 1, 2, 3].map((i) => <span key={i} className={`h-4 w-4 rounded-full border-2 border-primary ${i < pin.length ? "bg-primary" : ""}`} />)}
        </div>
        {err && <p className="-mt-3 mb-3 text-center text-sm text-destructive">{err}</p>}
        <div className="grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) =>
            k === "" ? <span key={i} /> : (
              <button key={i} onClick={() => (k === "⌫" ? setPin(pin.slice(0, -1)) : press(k))}
                className="rounded-2xl bg-muted py-4 text-xl font-bold hover:bg-accent">{k}</button>
            ))}
        </div>
      </div>
    </div>
  );
}
