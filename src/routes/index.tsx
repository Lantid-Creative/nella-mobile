import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { currentUser, resetDemoPin, signIn, signUp } from "@/lib/demo-store";
import logo from "@/assets/nella-footer-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nella — Log in or open an account" },
      {
        name: "description",
        content:
          "Log in with your phone number and PIN, or open a Nella account to send money and pay bills by chat.",
      },
      { property: "og:title", content: "Nella — Log in or open an account" },
      {
        property: "og:description",
        content:
          "Your money, in a chat. Send money, buy airtime and pay bills by chatting with Nella.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (currentUser()) navigate({ to: "/chat", replace: true });
  }, [navigate]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      if (mode === "up") {
        if (name.trim().split(/\s+/).length < 2) throw new Error("Enter your first and last name.");
        if (pin !== pin2) throw new Error("The two PINs don't match.");
        signUp(name, phone, pin);
        navigate({ to: "/chat" });
      } else if (mode === "reset") {
        if (pin !== pin2) throw new Error("The two PINs don't match.");
        resetDemoPin(phone, pin);
        setMode("in");
        setPin("");
        setPin2("");
        setSuccess(
          "Demo PIN reset in this browser. You can now log in. This does not recover or change a live account PIN.",
        );
      } else {
        signIn(phone, pin);
        navigate({ to: "/chat" });
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const field =
    "w-full rounded-xl border border-input bg-secondary/60 px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring";
  const pinField = `${field} tracking-[0.6em] text-center`;
  const onlyDigits = (v: string) => v.replace(/\D/g, "").slice(0, 4);

  return (
    <main className="bg-hero flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={logo.url} alt="Nella" className="h-10 w-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Your money, in a chat.</p>
        </div>

        <form onSubmit={submit} className="glass space-y-3 rounded-[28px] border border-border p-6">
          {mode !== "reset" ? (
            <div className="mb-2 grid grid-cols-2 rounded-xl bg-muted p-1 text-sm font-semibold">
              {(["in", "up"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError("");
                    setSuccess("");
                  }}
                  className={`min-h-10 rounded-lg transition ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  {m === "in" ? "Log in" : "Open account"}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <h1 className="text-lg font-bold">Reset demo PIN</h1>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                This only changes the PIN saved for this browser demo. It does not verify your
                identity or reset a live account.
              </p>
            </div>
          )}
          {mode === "up" && (
            <input
              className={field}
              required
              autoComplete="name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <div className="flex gap-2">
            <span className="flex items-center rounded-xl border border-input bg-muted px-3 text-sm font-semibold">
              +234
            </span>
            <input
              className={field}
              inputMode="tel"
              autoComplete="tel-national"
              required
              placeholder="801 234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <input
            className={pinField}
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={4}
            required
            placeholder={
              mode === "up" || mode === "reset" ? "Create 4-digit demo PIN" : "4-digit demo PIN"
            }
            value={pin}
            onChange={(e) => setPin(onlyDigits(e.target.value))}
          />
          {(mode === "up" || mode === "reset") && (
            <input
              className={pinField}
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={4}
              required
              placeholder="Confirm demo PIN"
              value={pin2}
              onChange={(e) => setPin2(onlyDigits(e.target.value))}
            />
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && (
            <p role="status" className="text-sm text-primary-glow">
              {success}
            </p>
          )}
          <button
            type="submit"
            className="mt-2 min-h-12 w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground transition active:translate-y-0.5"
            style={{ boxShadow: "var(--shadow-lip), var(--shadow-glow)" }}
          >
            {mode === "in" ? "Log in" : mode === "reset" ? "Reset demo PIN" : "Open my account"}
          </button>
          {mode === "up" && (
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              Use a unique test PIN. It is stored locally in this browser and is not suitable for
              banking.
            </p>
          )}
          {mode === "in" && (
            <button
              type="button"
              onClick={() => {
                setMode("reset");
                setPin("");
                setPin2("");
                setError("");
                setSuccess("");
              }}
              className="w-full py-2 text-sm font-semibold text-primary-glow hover:underline"
            >
              Forgot demo PIN?
            </button>
          )}
          {mode === "reset" && (
            <button
              type="button"
              onClick={() => {
                setMode("in");
                setPin("");
                setPin2("");
                setError("");
                setSuccess("");
              }}
              className="w-full py-2 text-sm font-semibold text-primary-glow hover:underline"
            >
              Back to log in
            </button>
          )}
        </form>
        <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
          Preview app — accounts and PINs are stored in this browser only. Don’t use real banking
          credentials. Live account verification is not connected.
        </p>
      </div>
    </main>
  );
}
