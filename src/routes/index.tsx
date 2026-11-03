import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { currentUser, signIn, signUp } from "@/lib/demo-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nella Chat — Sign in" },
      { name: "description", content: "Sign in or create your Nella account to start chatting." },
      { property: "og:title", content: "Nella Chat — Sign in" },
      { property: "og:description", content: "Sign in or create your Nella account to start chatting." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentUser()) navigate({ to: "/chat", replace: true });
  }, [navigate]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (mode === "up") {
        if (!name.trim()) throw new Error("Please enter your name.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        signUp(name, email, password);
      } else signIn(email, password);
      navigate({ to: "/chat" });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const input =
    "w-full rounded-xl border border-input bg-secondary/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <main className="bg-hero flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="bg-orb shadow-glow mb-6 h-20 w-20 animate-pulse rounded-full" />
          <h1 className="text-3xl font-extrabold tracking-tight">Nella</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your money, in a chat.</p>
        </div>

        <form onSubmit={submit} className="glass space-y-3 rounded-3xl border border-border p-6">
          <div className="mb-2 grid grid-cols-2 rounded-xl bg-muted p-1 text-sm font-semibold">
            {(["in", "up"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(""); }}
                className={`rounded-lg py-2 transition ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {m === "in" ? "Log in" : "Create account"}
              </button>
            ))}
          </div>
          {mode === "up" && (
            <input className={input} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={input} type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            className="shadow-glow mt-2 w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground transition active:translate-y-0.5"
            style={{ boxShadow: "var(--shadow-lip), var(--shadow-glow)" }}
          >
            {mode === "in" ? "Log in" : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">Demo version — accounts are saved in this browser only.</p>
      </div>
    </main>
  );
}
