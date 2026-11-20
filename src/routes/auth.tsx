import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { currentUser, signIn, ApiError } from "@/lib/api";
import { formatPhone, loginPinReady } from "@/lib/mobile-ux";
import { Button } from "@/components/ui/button";
import { NellaMascot } from "@/components/nella-mascot";
import nellaLogo from "@/assets/nella-nav-logo.png";
import nellaLogoDark from "@/assets/nella-footer-logo.png";

const WHATSAPP = "https://wa.me/2348079574994";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Nella — Log in" },
      {
        name: "description",
        content: "Log in to Nella, your money companion on WhatsApp and in the app.",
      },
      { property: "og:title", content: "Nella — Log in" },
      {
        property: "og:description",
        content: "Log in to Nella with the phone number and PIN you use on WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (currentUser()) navigate({ to: "/chat", replace: true });
  }, [navigate]);

  const login = async (value: string) => {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const local = phone.replace(/\D/g, "");
      await signIn(`0${local}`, value);
      navigate({ to: "/chat", replace: true });
    } catch (err) {
      setPin("");
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn’t reach Nella. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^[789][01]\d{8}$/.test(phone.replace(/\D/g, ""))) {
      setError("Enter the 10-digit phone number on your Nella account.");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError("Your PIN is 4 digits.");
      return;
    }
    await login(pin);
  };

  const field =
    "h-13 w-full min-w-0 rounded-xl border border-input bg-card px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";
  const digits = (v: string) => v.replace(/\D/g, "").slice(0, 4);

  return (
    <main className="auth-surface flex min-h-dvh flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <header className="grid h-12 grid-cols-[minmax(0,1fr)_auto] items-center">
          <span />
          <span className="text-2xl font-extrabold text-primary">
            <img
              src={nellaLogo}
              alt="Nella"
              width={697}
              height={178}
              className="h-6 w-auto dark:hidden"
            />
            <img
              src={nellaLogoDark}
              alt="Nella"
              width={697}
              height={178}
              className="hidden h-6 w-auto dark:block"
            />
          </span>
        </header>
        <div className="step-enter flex flex-1 flex-col justify-center py-5">
          <div className="mb-5 flex items-center gap-3">
            <NellaMascot className="h-24 w-24" />
            <span className="rounded-xl rounded-bl-none bg-secondary px-4 py-2 text-sm font-semibold text-primary">
              Good to see you 👋
            </span>
          </div>
          <h1 className="text-[28px] font-extrabold leading-tight">Welcome back.</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Your money companion is right here.
          </p>
          <form onSubmit={submit} className="mt-7 space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-semibold">Phone number</span>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
                <span className="flex items-center rounded-xl border border-input bg-secondary px-3 text-sm font-semibold">
                  +234
                </span>
                <input
                  aria-label="Phone number"
                  className={field}
                  inputMode="tel"
                  autoComplete="tel-national"
                  required
                  placeholder="801 234 5678"
                  value={phone}
                  onChange={(e) => {
                    setPhone(formatPhone(e.target.value));
                    setError("");
                  }}
                />
              </div>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold">PIN</span>
              <div className="relative">
                <input
                  aria-label="PIN"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "auth-error" : undefined}
                  className={`${field} pr-12 text-center tabular-nums`}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  autoComplete="current-password"
                  maxLength={4}
                  minLength={4}
                  required
                  placeholder="4-digit PIN"
                  value={pin}
                  onChange={(e) => {
                    const value = digits(e.target.value);
                    setPin(value);
                    setError("");
                    if (!busy && loginPinReady(phone, value)) void login(value);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                  className="absolute right-1 top-1 h-11 w-11 text-muted-foreground"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </label>
            <div className="flex justify-end">
              <a
                href={`${WHATSAPP}?text=${encodeURIComponent("I need help resetting my Nella PIN.")}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 items-center px-0 text-sm font-bold text-primary underline-offset-4 hover:underline"
              >
                Forgot PIN?
              </a>
            </div>
            {error && (
              <p
                id="auth-error"
                role="alert"
                className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={busy}
              className="h-13 w-full rounded-xl font-bold shadow-glow"
            >
              {busy ? "Signing in…" : "Log in"}
              <ArrowRight />
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to Nella?{" "}
            <a
              href={`${WHATSAPP}?text=${encodeURIComponent("Hi Nella, I'd like to open an account.")}`}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-primary underline-offset-4 hover:underline"
            >
              Chat with us on WhatsApp
            </a>
          </p>
        </div>
        <footer className="border-t border-border pt-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <LockKeyhole className="h-3.5 w-3.5" /> Nella never asks for your PIN in chat
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            Banking services by VFD Microfinance Bank. Nella is a product of Lantid Creative LTD.
          </p>
          <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <a href="/privacy" className="underline underline-offset-2">
              Privacy
            </a>
            <span>·</span>
            <a href="/terms" className="underline underline-offset-2">
              Terms
            </a>
            <span>·</span>
            <a href="/support" className="underline underline-offset-2">
              Support
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
