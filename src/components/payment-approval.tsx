import { useEffect, useState, type FormEvent } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { naira } from "@/lib/chat-store";
import type { ReceiptPreview } from "@/lib/app-provisions";
import type { ExecuteResult } from "@/lib/api";

const DETAIL_ROWS = [
  "Recipient account",
  "Phone number",
  "Meter number",
  "Smartcard number",
  "Customer number",
  "Recipient",
  "Account name",
  "Bank",
  "Provider",
  "Plan / package",
  "Narration",
  "Fee",
  "Total",
  "Reference",
];

export function PaymentApproval({
  receipt,
  onClose,
  onApprove,
  onApproved,
}: {
  receipt: ReceiptPreview;
  onClose: () => void;
  onApprove: (pin: string) => Promise<ExecuteResult>;
  onApproved: (message: string) => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const close = () => {
    if (busy) return;
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

  const submitPin = async (value: string) => {
    if (busy) return;
    setPin("");
    setBusy(true);
    setError("");
    try {
      const result = await onApprove(value);
      if (result.ok) {
        onApproved(result.message);
        return;
      }
      setError(result.message || "That payment was not approved. Nothing was sent.");
      setShake((n) => n + 1);
      try {
        navigator.vibrate?.([30, 40, 30]);
      } catch {
        /* unsupported */
      }
    } catch {
      setError("Couldn’t reach Nella. Check your connection — nothing was sent twice.");
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (/^\d{4}$/.test(pin)) void submitPin(pin);
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
            Enter the 4-digit PIN you use for Nella.
          </DialogDescription>
        </div>
        <div className="border-y border-border py-4">
          <p className="text-sm font-semibold">{receipt.title}</p>
          <p className="mt-1 break-all text-2xl font-extrabold">{naira(receipt.amount)}</p>
          <dl className="mt-3 space-y-2 text-sm">
            {receipt.rows
              .filter(([key]) => DETAIL_ROWS.includes(key))
              .map(([key, value]) => (
                <div key={key} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="min-w-0 break-all text-right font-semibold">{value}</dd>
                </div>
              ))}
          </dl>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-semibold">
            4-digit PIN
            <input
              aria-label="4-digit PIN"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              disabled={busy}
              value={pin}
              onChange={(event) => {
                const value = event.target.value.replace(/\D/g, "").slice(0, 4);
                setPin(value);
                setError("");
                if (value.length === 4) void submitPin(value);
              }}
              key={shake}
              className={`${shake ? "pin-shake " : ""}mt-2 h-14 w-full rounded-lg border border-input bg-card px-4 text-center text-xl tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring`}
              autoFocus
            />
          </label>
          <p className="text-xs text-muted-foreground">
            {busy
              ? "Sending your payment…"
              : "Your PIN approves this payment. Nella never asks for it in chat."}
          </p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy || pin.length !== 4} className="h-12 w-full">
            <ShieldCheck />
            {busy ? "Processing…" : "Confirm payment"}
          </Button>
          <Button type="button" variant="outline" className="h-11 w-full" onClick={close}>
            Back to chat
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
