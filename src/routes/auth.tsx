import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, ScanFace, LockKeyhole, ShieldCheck, Check } from "lucide-react";
import { canEnterChat, completeDemoKyc, completeOnboarding, currentUser, normalisePhone, resetDemoPin, seedDemoLogin, signIn, signInVerified, signUp } from "@/lib/demo-store";
import { biometricPhone, biometricsAvailable, enableBiometrics, unlockWithBiometrics } from "@/lib/biometrics";
import { Button } from "@/components/ui/button";
import { NellaMascot } from "@/components/nella-mascot";
import { KycSetup } from "@/components/kyc-setup";
import nellaLogo from "@/assets/nella-nav-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Nella — Log in or get started" },
    { name: "description", content: "Log in to Nella or complete guided signup and required demo KYC setup before entering chat." },
    { property: "og:title", content: "Nella — Log in or get started" },
    { property: "og:description", content: "A friendly, chat-first money experience with guided signup and required demo KYC setup." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }), component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bioPhone, setBioPhone] = useState<string | null>(null);
  const [bioBusy, setBioBusy] = useState(false);
  const resumeAccount = () => {
    const user = currentUser();
    if (canEnterChat(user)) { navigate({ to: "/chat", replace: true }); return; }
    if (user) { setName(user.name); setPhone(user.phone); setMode("up"); setStep(3); setPin(""); setPin2(""); }
  };
  useEffect(() => {
    const user = currentUser();
    if (canEnterChat(user)) navigate({ to: "/chat", replace: true });
    else if (user) { setName(user.name); setPhone(user.phone); setMode("up"); setStep(3); }
  }, [navigate]);
  useEffect(() => { void biometricsAvailable().then((ok) => { if (ok) setBioPhone(biometricPhone()); }); }, []);
  const switchMode = (next: typeof mode) => { setMode(next); setStep(0); setPin(""); setPin2(""); setError(""); setSuccess(""); };
  const unlock = async () => {
    setBioBusy(true); setError("");
    const unlocked = await unlockWithBiometrics();
    setBioBusy(false);
    if (!unlocked) { setError("Biometric unlock didn't work this time. Use your PIN instead."); return; }
    try { signInVerified(unlocked); resumeAccount(); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't open your account. Use your PIN instead."); }
  };
  const finishSetup = () => {
    try { completeOnboarding(); navigate({ to: "/chat", replace: true }); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save your setup. Try again."); }
  };
  const finishKyc = async () => {
    setError("");
    try {
      completeDemoKyc();
      if ((await biometricsAvailable()) && !bioPhone) { setStep(4); return; }
      finishSetup();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save your KYC setup. Try again."); }
  };
  const setupBiometrics = async () => {
    setBioBusy(true); setError("");
    try {
      const phoneNumber = normalisePhone(phone);
      if (!phoneNumber) throw new Error("Enter a valid Nigerian phone number.");
      await enableBiometrics(phoneNumber, name);
      setBioPhone(phoneNumber);
      finishSetup();
    } catch (err) { setError(err instanceof Error ? err.message : "Biometric setup failed. Your PIN still works."); }
    finally { setBioBusy(false); }
  };
  const demoLogin = () => {
    setError("");
    try { seedDemoLogin(); navigate({ to: "/chat", replace: true }); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't open the demo account. Try again."); }
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      if (mode === "up" && step === 0) { setStep(1); return; }
      if (mode === "up" && step === 1) {
        if (name.trim().split(/\s+/).length < 2) throw new Error("Enter your first and last name.");
        if (!normalisePhone(phone)) throw new Error("Enter a valid Nigerian phone number.");
        setStep(2); return;
      }
      if (mode === "up" && step === 3) {
        return;
      }
      if (mode === "up") {
        if (pin !== pin2) throw new Error("The two PINs don't match.");
        signUp(name, phone, pin);
        setPin(""); setPin2(""); setStep(3);
      } else if (mode === "reset") {
        if (pin !== pin2) throw new Error("The two PINs don't match.");
        resetDemoPin(phone, pin); switchMode("in"); setSuccess("Your demo PIN has been reset in this browser. You can log in now.");
      } else { signIn(phone, pin); resumeAccount(); }
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong. Try again."); }
  };
  const field = "h-13 w-full min-w-0 rounded-xl border border-input bg-card px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";
  const digits = (v: string) => v.replace(/\D/g, "").slice(0, 4);
  const title = mode === "in" ? "Welcome back." : mode === "reset" ? "Let's get you back in." : step === 0 ? "Hi, I'm Nella." : step === 1 ? "Let's get to know you." : step === 3 ? "Finish your setup." : "A PIN, just for you.";
  const subtitle = mode === "in" ? "Your money companion is right here." : mode === "reset" ? "Reset the demo PIN saved in this browser." : step === 0 ? "Your money, in a chat. Let's get you started." : step === 1 ? "What should I call you?" : step === 3 ? "Check your details before meeting Nella." : "Choose a 4-digit test PIN to access this demo.";
  return (
    <main className="auth-surface flex min-h-dvh flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <header className="grid h-12 grid-cols-[minmax(0,1fr)_auto] items-center">
          <div>{mode !== "in" && step < 3 && <Button variant="ghost" size="icon" aria-label="Go back" className="h-11 w-11 rounded-full" onClick={() => { if (mode === "up" && step > 0) { setStep(step - 1); setError(""); } else switchMode("in"); }}><ArrowLeft /></Button>}</div>
          <span className="text-2xl font-extrabold text-primary"><img src={nellaLogo.url} alt="Nella" width={697} height={178} className="h-6 w-auto" /></span>
        </header>
        {mode === "up" && <div aria-label={`Setup step ${Math.min(step, 3) + 1} of 4`} className="mt-4 flex gap-2">{[0,1,2,3].map(s => <span key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-border"}`} />)}</div>}
        <div key={`${mode}-${step}`} className="step-enter flex flex-1 flex-col justify-center py-5">
          {mode === "up" && step === 3 ? <KycSetup name={name} phone={normalisePhone(phone) ?? phone} error={error} onComplete={() => void finishKyc()} /> : mode === "up" && step === 4 ? <div className="flex flex-1 flex-col justify-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-secondary"><ScanFace className="h-14 w-14 text-primary" /></div>
            <h1 className="mt-6 text-[28px] font-extrabold leading-tight">Unlock with biometrics.</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Next time you open Nella, use your phone's own unlock method — fingerprint, face or pattern — instead of your PIN. Your payment PIN stays separate and is never replaced.</p>
            {error && <p role="alert" className="mt-5 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <div className="mt-7 space-y-3">
              <Button className="h-13 w-full rounded-xl font-bold shadow-glow" disabled={bioBusy} onClick={() => void setupBiometrics()}>{bioBusy ? "Waiting for your device…" : "Set up biometric unlock"}<ScanFace /></Button>
              <Button variant="ghost" className="h-12 w-full" onClick={finishSetup}>Maybe later</Button>
            </div>
          </div> : <>
          <div className="mb-5 flex items-center gap-3">
            <NellaMascot className={mode === "up" && step === 0 ? "h-44 w-44 mx-auto" : "h-24 w-24"} />
            {!(mode === "up" && step === 0) && <span className="rounded-xl rounded-bl-none bg-secondary px-4 py-2 text-sm font-semibold text-primary">{mode === "in" ? "Good to see you 👋" : step === 2 ? "Almost there!" : "Hello there 👋"}</span>}
          </div>
          <h1 className="text-[28px] font-extrabold leading-tight">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          <form onSubmit={submit} className="mt-7 space-y-5">
            {mode === "up" && step === 0 ? <div className="space-y-5">
              {[['01', 'A little about you', 'Your name and phone number.'], ['02', 'Your private PIN', 'A test PIN for this demo.'], ['03', 'Required KYC setup', 'Review your identity and sample address before chat.']].map(([n,t,d]) => <div key={n} className="flex items-center gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">{n}</span><div><p className="text-sm font-bold">{t}</p><p className="mt-0.5 text-xs text-muted-foreground">{d}</p></div></div>)}
              <div className="border-t border-border pt-4"><p className="flex items-center gap-2 text-xs font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> When live account opening is available</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">You'll verify your NIN, BVN, date of birth and home address in a secure form. Don't send these details in chat. Identity verification isn't connected yet.</p></div>
            </div> : <>
              {mode === "up" && step === 1 && <label className="block space-y-2"><span className="text-sm font-semibold">Full name</span><input autoFocus className={field} required autoComplete="name" placeholder="First and last name" value={name} onChange={e => setName(e.target.value)} /></label>}
              {(mode !== "up" || step === 1) && <label className="block space-y-2"><span className="text-sm font-semibold">Phone number</span><div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2"><span className="flex items-center rounded-xl border border-input bg-secondary px-3 text-sm font-semibold">+234</span><input aria-label="Phone number" className={field} inputMode="tel" autoComplete="tel-national" required placeholder="801 234 5678" value={phone} onChange={e => setPhone(e.target.value)} /></div></label>}
              {(mode !== "up" || step === 2) && <>
                <label className="block space-y-2"><span className="text-sm font-semibold">{mode === "in" ? "Demo PIN" : "Create demo PIN"}</span><div className="relative"><input aria-label={mode === "in" ? "Demo PIN" : "Create demo PIN"} autoFocus={mode === "up"} className={`${field} pr-12 text-center tabular-nums`} type={showPin ? "text" : "password"} inputMode="numeric" autoComplete={mode === "in" ? "current-password" : "new-password"} maxLength={4} minLength={4} required placeholder="4-digit PIN" value={pin} onChange={e => setPin(digits(e.target.value))} /><Button type="button" variant="ghost" size="icon" aria-label={showPin ? "Hide PIN" : "Show PIN"} className="absolute right-1 top-1 h-11 w-11 text-muted-foreground" onClick={() => setShowPin(!showPin)}>{showPin ? <EyeOff /> : <Eye />}</Button></div></label>
                {mode !== "in" && <label className="block space-y-2"><span className="text-sm font-semibold">Confirm demo PIN</span><input className={`${field} text-center tabular-nums`} type={showPin ? "text" : "password"} inputMode="numeric" autoComplete="new-password" maxLength={4} minLength={4} required placeholder="Enter your PIN again" value={pin2} onChange={e => setPin2(digits(e.target.value))} /></label>}
                {mode === "in" && <div className="flex justify-end"><Button type="button" variant="link" className="h-11 px-0 text-sm" onClick={() => switchMode("reset")}>Forgot demo PIN?</Button></div>}
              </>}
            </>}
            {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            {success && <p role="status" className="flex items-start gap-2 text-sm text-primary"><Check className="h-5 w-5 shrink-0" />{success}</p>}
            <Button type="submit" className="h-13 w-full rounded-xl font-bold shadow-glow">{mode === "in" ? "Log in" : mode === "reset" ? "Reset demo PIN" : step === 0 ? "Let's get started" : step === 1 ? "Continue" : step === 2 ? "Create demo account" : "Complete setup"}<ArrowRight /></Button>
            {mode === "in" && bioPhone && <Button type="button" variant="outline" className="h-13 w-full rounded-xl font-bold" disabled={bioBusy} onClick={() => void unlock()}><ScanFace className="text-primary" />{bioBusy ? "Waiting for your device…" : "Unlock with biometrics"}</Button>}
            {mode === "in" && <>
              <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
              <Button type="button" variant="secondary" className="h-13 w-full rounded-xl font-bold" onClick={demoLogin}>Try the demo account<ArrowRight /></Button>
              <p className="text-center text-xs leading-relaxed text-muted-foreground">One tap, no signup — a ready demo account with setup already done.</p>
            </>}
          </form>
          {mode === "in" && <p className="mt-6 text-center text-sm text-muted-foreground">New to Nella? <Button variant="link" className="h-11 px-1 font-bold" onClick={() => switchMode("up")}>Get started</Button></p>}
          {mode === "up" && step === 2 && <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Use a unique test PIN, not your banking PIN. This demo stores it in this browser only.</p>}
          </>}
        </div>
        <footer className="border-t border-border pt-4 text-center"><p className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5" /> Preview only · No real money moves</p><p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">Accounts stay in this browser. Live banking isn't connected.</p></footer>
      </div>
    </main>
  );
}
