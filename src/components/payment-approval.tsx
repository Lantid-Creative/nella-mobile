import { useEffect, useState, type FormEvent } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { naira, type DemoUser } from "@/lib/demo-store";
import type { ReceiptPreview } from "@/lib/app-provisions";
import { demoApprovalError } from "@/lib/payment-approval";

export function PaymentApproval({
  receipt,
  user,
  onClose,
  onComplete,
}: {
  receipt: ReceiptPreview;
  user: DemoUser;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const close = () => {
    setPin("");
    setError("");
    onClose();
  };
  useEffect(() => {
    const visibility = () => {
      if (document.hidden) {
        setPin("");
        setError("");
        onClose();
      }
    };
    const leave = () => {
      setPin("");
      onClose();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", leave);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", leave);
    };
  }, [onClose]);
  const [shake, setShake] = useState(0);
  const check = (value: string) => {
    const problem = demoApprovalError(value, user);
    setPin("");
    if (problem) {
      setError(problem);
      setShake((n) => n + 1);
      try {
        navigator.vibrate?.([30, 40, 30]);
      } catch {
        /* unsupported */
      }
      return;
    }
    onComplete();
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    check(pin);
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="nella-approval left-0 top-auto bottom-0 max-h-[calc(var(--app-height,100dvh)-1rem)] overflow-y-auto translate-x-0 translate-y-0 rounded-t-2xl px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg">
        <div className="pr-12">
          <LockKeyhole className="mb-3 h-6 w-6 text-primary" />
          <DialogTitle>Approve payment</DialogTitle>
          <DialogDescription className="mt-2">
            Demo approval only · No money will move
          </DialogDescription>
        </div>
        <div className="border-y border-border py-4">
          <p className="text-sm font-semibold">{receipt.title}</p>
          <p className="mt-1 break-all text-2xl font-extrabold">{naira(receipt.amount)}</p>
          <dl className="mt-3 space-y-2 text-sm">
            {receipt.rows
              .filter(([key]) =>
                [
                  "Recipient account",
                  "Phone number",
                  "Meter number",
                  "Smartcard number",
                  "Bank",
                  "Provider",
                  "Plan / package",
                  "Narration",
                ].includes(key),
              )
              .map(([key, value]) => (
                <div key={key} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="min-w-0 break-all text-right font-semibold">{value}</dd>
                </div>
              ))}
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Recipient, availability and fees are not verified.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-semibold">
            4-digit demo PIN
            <input
              aria-label="4-digit demo PIN"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={pin}
              onChange={(event) => {
                const value = event.target.value.replace(/\D/g, "").slice(0, 4);
                setPin(value);
                setError("");
                if (value.length === 4) check(value);
              }}
              key={shake}
              className={`${shake ? "pin-shake " : ""}mt-2 h-14 w-full rounded-lg border border-input bg-card px-4 text-center text-xl tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring`}
              autoFocus
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Use the test PIN from your demo account, never your banking PIN.
          </p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pin.length !== 4} className="h-12 w-full">
            <ShieldCheck />
            Confirm demo approval
          </Button>
          <Button type="button" variant="outline" className="h-11 w-full" onClick={close}>
            Back to chat
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
