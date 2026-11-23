import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CircleHelp,
  Copy,
  FileText,
  Landmark,
  LockKeyhole,
  Pencil,
  ReceiptText,
  ScanFace,
  ShieldCheck,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import type { PaymentField } from "@/lib/chat-payments";
import {
  biometricsAvailable,
  disableBiometrics,
  enableBiometrics,
  hasBiometrics,
} from "@/lib/biometrics";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { NellaMascot } from "@/components/nella-mascot";
import { naira } from "@/lib/chat-store";
import {
  ApiError,
  balance as fetchBalance,
  beneficiaries as fetchBeneficiaries,
  history as fetchHistory,
  receipt as fetchReceipt,
  removeBeneficiary,
  type Beneficiary,
  type PublicUser,
  type ReceiptPreview as ApiReceipt,
  type Transaction,
} from "@/lib/api";
import { SERVICE_LABELS, type AppPanel, type ReceiptPreview } from "@/lib/app-provisions";

const WHATSAPP = "https://wa.me/2348079574994";
const SUPPORT_EMAIL = "support@usenella.com";

const TITLES: Record<AppPanel, string> = {
  ...SERVICE_LABELS,
  services: "What would you like to do?",
  account: "Your Nella account",
  onboarding: "Your account",
  activity: "Activity & receipts",
  notifications: "Notifications",
  beneficiaries: "Your beneficiaries",
  scheduled: "Scheduled payments",
  security: "Security & PIN",
  support: "Help & support",
  insights: "Spending & statements",
  business: "Nella for business",
  referrals: "Referrals & ambassadors",
};
const FIELD =
  "mt-2 h-12 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/20";
type SupportDraft = { category: string; reference: string; details: string };

const errorText = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

export function NellaServices({
  panel,
  onChange,
  onBack,
  depth,
  user,
}: {
  panel: AppPanel | null;
  onChange: (panel: AppPanel | null) => void;
  onBack: () => void;
  depth: number;
  user: PublicUser;
}) {
  const [support, setSupport] = useState<SupportDraft>({
    category: "Transfer issue",
    reference: "",
    details: "",
  });
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setSupport({ category: "Transfer issue", reference: "", details: "" });
  }, [user.phone]);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [panel]);
  return (
    <Dialog
      open={panel !== null}
      onOpenChange={(open) => {
        if (!open) onChange(null);
      }}
    >
      <DialogContent className="nella-sheet left-0 top-auto flex max-h-[calc(var(--app-height,100dvh)-1rem)] flex-col gap-0 overflow-hidden translate-x-0 translate-y-0 rounded-t-2xl p-0 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
        <header className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border px-3 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            aria-label="Back"
            onClick={() => (depth > 0 ? onBack() : onChange(null))}
          >
            <ArrowLeft />
          </Button>
          <div className="min-w-0">
            <DialogTitle className="break-words text-base leading-snug">
              {panel ? TITLES[panel] : "Nella"}
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs">
              Banking services by VFD Microfinance Bank
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            aria-label="Close"
            onClick={() => onChange(null)}
          >
            <X />
          </Button>
        </header>
        <div
          ref={bodyRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4"
        >
          <PanelBody
            panel={panel}
            onChange={onChange}
            user={user}
            support={support}
            setSupport={setSupport}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PanelBody({
  panel,
  onChange,
  user,
  support,
  setSupport,
}: {
  support: SupportDraft;
  setSupport: Dispatch<SetStateAction<SupportDraft>>;
  panel: AppPanel | null;
  onChange: (panel: AppPanel | null) => void;
  user: PublicUser;
}) {
  const { category: supportCategory, reference, details } = support;
  const setSupportCategory = (category: string) =>
    setSupport((previous) => ({ ...previous, category }));
  const setReference = (reference: string) =>
    setSupport((previous) => ({ ...previous, reference }));
  const setDetails = (details: string) => setSupport((previous) => ({ ...previous, details }));
  const [securityStep, setSecurityStep] = useState("");
  useEffect(() => {
    setSecurityStep("");
  }, [user.phone]);
  if (panel === null) return null;
  if (panel in SERVICE_LABELS || panel === "services") return null;
  if (panel === "onboarding")
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <NellaMascot small className="h-16 w-16" />
          <div>
            <p className="font-bold">Hi, {(user.fullName ?? "").split(" ")[0] || "there"}.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.onboardingComplete
                ? "Your Nella account is open and ready."
                : "Your account is still being set up. Chat with us on WhatsApp to finish it."}
            </p>
          </div>
        </div>
        <div className="border-l-2 border-primary pl-4">
          <p className="flex items-center gap-2 text-sm font-bold">
            <Check className="h-4 w-4 text-primary" /> Phone &amp; PIN
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            +234 {user.phone.slice(-10)} · your PIN is never shown or sent in chat
          </p>
        </div>
        <div className="border-l-2 border-border pl-4">
          <p className="text-sm font-bold">Identity verification</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {user.onboardingComplete
              ? "Completed — your Nella account is active."
              : "Opening or updating an account happens with our team on WhatsApp."}
          </p>
        </div>
        <Info
          title="Never share your PIN or OTP"
          text="Nella will never ask for your PIN in chat or on a call. If someone does, stop and contact support."
        />
        <Button className="h-12 w-full" asChild>
          <a
            href={`${WHATSAPP}?text=${encodeURIComponent("Hi Nella, I need help with my account.")}`}
            target="_blank"
            rel="noreferrer"
          >
            Chat with support
            <ArrowRight />
          </a>
        </Button>
      </div>
    );
  if (panel === "account") return <AccountPanel user={user} onChange={onChange} />;
  if (panel === "activity") return <ActivityPanel />;
  if (panel === "beneficiaries") return <BeneficiariesPanel onChange={onChange} />;
  if (panel === "notifications")
    return (
      <div className="space-y-4">
        <Empty
          icon={Bell}
          title="Alerts arrive in chat"
          text="Payment confirmations and receipts come from Nella in the chat and by WhatsApp, so there is nothing to switch on in the app."
        />
        <div className="divide-y divide-border">
          {[
            "Money received & funding",
            "Transfer sent, failed or reversed",
            "Airtime, data & bill results",
            "Electricity token & receipts",
            "Account & verification updates",
            "Support replies",
          ].map((label) => (
            <div key={label} className="flex items-start gap-3 py-3 text-sm">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{label}</span>
            </div>
          ))}
        </div>
        <Info
          title="Device push is not switched on"
          text="This version of the app does not send push notifications. Your WhatsApp messages from Nella are the record of what happened."
        />
      </div>
    );
  if (panel === "scheduled")
    return (
      <div className="space-y-5">
        <Empty
          icon={FileText}
          title="Automatic payments are not available"
          text="Recurring transfers and standing orders are not part of Nella today. Nothing you prepare here is scheduled."
        />
        <Button variant="outline" className="h-12 w-full" onClick={() => onChange("services")}>
          Make a one-off payment
          <ArrowRight />
        </Button>
      </div>
    );
  if (panel === "security")
    return (
      <div className="space-y-4">
        <Info
          title="Keep your PIN private"
          text="Nella never asks for your PIN in chat, by email or on a call. Your PIN is only entered in the secure approval sheet when you pay."
        />
        <BiometricSetting user={user} />
        <div className="divide-y divide-border">
          {["Forgot payment PIN", "Change payment PIN", "Freeze my account"].map((label) => (
            <Action key={label} label={label} onClick={() => setSecurityStep(label)} />
          ))}
        </div>
        {securityStep && (
          <div role="status" className="border-t border-border pt-4">
            <h3 className="font-bold">{securityStep}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {securityStep === "Freeze my account"
                ? "Freezing an account is done by our support team so nothing moves while it is locked. Message us and we will freeze it for you."
                : "PIN changes are done with our support team after we verify it is you. Message us on WhatsApp and we will take you through it."}
            </p>
            <Button className="mt-3 h-11" asChild>
              <a
                href={`${WHATSAPP}?text=${encodeURIComponent(
                  `Hi Nella, I need help with: ${securityStep.toLowerCase()}.`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <CircleHelp />
                Message support
              </a>
            </Button>
          </div>
        )}
      </div>
    );
  if (panel === "support")
    return (
      <div className="space-y-4">
        <Info
          title="Never share your PIN or OTP"
          text="Support will never ask for your PIN, your OTP or your bank password. Describe the issue and include a transaction reference when you have one."
        />
        <label className="block text-sm font-semibold">
          Issue
          <select
            className={FIELD}
            value={supportCategory}
            onChange={(event) => setSupportCategory(event.target.value)}
          >
            {[
              "Transfer issue",
              "Airtime or data",
              "Bill payment",
              "Account opening",
              "Security concern",
              "Something else",
            ].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Transaction reference{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
          <input
            maxLength={120}
            className={FIELD}
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="Reference from your receipt"
          />
        </label>
        <label className="block text-sm font-semibold">
          What happened?
          <textarea
            maxLength={1000}
            className={`${FIELD} h-28 py-3`}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Describe the problem without sensitive details"
          />
        </label>
        <Button className="h-12 w-full" asChild>
          <a
            href={`${WHATSAPP}?text=${encodeURIComponent(
              [
                `Hi Nella, I need help with ${supportCategory.toLowerCase()}.`,
                reference ? `Reference: ${reference}` : "",
                details,
              ]
                .filter(Boolean)
                .join("\n"),
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            Message us on WhatsApp
            <ArrowRight />
          </a>
        </Button>
        <Button variant="outline" className="h-12 w-full" asChild>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
              `Nella support — ${supportCategory}`,
            )}&body=${encodeURIComponent(
              [reference ? `Reference: ${reference}` : "", details].filter(Boolean).join("\n"),
            )}`}
          >
            Email {SUPPORT_EMAIL}
          </a>
        </Button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Support replies arrive on WhatsApp, usually within a few minutes during working hours.
        </p>
      </div>
    );
  if (panel === "insights") return <InsightsPanel onChange={onChange} />;
  if (panel === "referrals")
    return (
      <div className="space-y-5">
        <Empty
          icon={FileText}
          title="Referrals are invite-only"
          text="There is no public referral code in the app yet. If you would like to refer someone, message us and the team will handle it."
        />
        <Button variant="outline" className="h-12 w-full" onClick={() => onChange("support")}>
          Ask about referrals
          <ArrowRight />
        </Button>
      </div>
    );
  return (
    <div className="space-y-4">
      <Info
        title="Nella for business"
        text="Invoice, collection and bulk-payment tools are arranged with our team rather than from inside this app."
      />
      {[
        "Invoices & payment requests",
        "Payroll & bulk transfers",
        "Collections & reconciliation",
        "Staff roles & approvals",
      ].map((label) => (
        <div
          key={label}
          className="flex items-center justify-between gap-3 border-b border-border py-3"
        >
          <p className="text-sm font-semibold">{label}</p>
          <span className="shrink-0 text-xs text-muted-foreground">Via support</span>
        </div>
      ))}
      <Button variant="outline" className="h-12 w-full" asChild>
        <a
          href={`${WHATSAPP}?text=${encodeURIComponent("Hi Nella, I'd like to use Nella for my business.")}`}
          target="_blank"
          rel="noreferrer"
        >
          Talk to the team
          <ArrowRight />
        </a>
      </Button>
    </div>
  );
}

function AccountPanel({
  user,
  onChange,
}: {
  user: PublicUser;
  onChange: (panel: AppPanel | null) => void;
}) {
  const [balanceMinor, setBalanceMinor] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  useEffect(() => {
    let active = true;
    fetchBalance()
      .then((b) => {
        if (active) setBalanceMinor(b.balanceMinor);
      })
      .catch((e: unknown) => {
        if (active) setError(errorText(e, "Your balance could not be loaded right now."));
      });
    return () => {
      active = false;
    };
  }, [user.phone]);

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setCopied("");
    }
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-border py-4">
        <Wallet className="mb-3 h-7 w-7 text-primary" />
        <p className="text-sm text-muted-foreground">Available balance</p>
        <p className="mt-1 break-all text-2xl font-extrabold tabular-nums">
          {balanceMinor === null ? (error ? "Unavailable" : "Loading…") : naira(balanceMinor / 100)}
        </p>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
      <p className="text-sm font-semibold">Account details for bank transfers</p>
      <dl className="space-y-3 text-sm">
        {(
          [
            ["Account holder", user.fullName ?? "—"],
            ["Bank", user.bankName],
            ["Account number", user.accountNumber ?? "—"],
          ] as [string, string][]
        ).map(([key, value]) => (
          <div key={key} className="flex items-start justify-between gap-3">
            <dt className="shrink-0 text-muted-foreground">{key}</dt>
            <dd className="flex min-w-0 items-center gap-1 text-right font-semibold">
              <span className="min-w-0 break-all">{value}</span>
              {key !== "Bank" && value !== "—" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  aria-label={`Copy ${key.toLowerCase()}`}
                  onClick={() => void copy(key, value)}
                >
                  {copied === key ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <Info
        title="Fund with a bank transfer"
        text="Send money to your account number above from any Nigerian bank. It lands in this Nella wallet and can be spent in chat."
      />
      <Button className="h-12 w-full" onClick={() => onChange("transfer")}>
        Send money
        <ArrowRight />
      </Button>
    </div>
  );
}

function ActivityPanel() {
  const [rows, setRows] = useState<Transaction[] | null>(null);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<ApiReceipt | null>(null);
  const [receiptError, setReceiptError] = useState("");
  const [loadingRef, setLoadingRef] = useState("");

  useEffect(() => {
    let active = true;
    fetchHistory(1, 30)
      .then((page) => {
        if (active) setRows(page.transactions);
      })
      .catch((e: unknown) => {
        if (active) setError(errorText(e, "Your activity could not be loaded right now."));
      });
    return () => {
      active = false;
    };
  }, []);

  const open = async (reference: string) => {
    setLoadingRef(reference);
    setReceiptError("");
    try {
      setReceipt(await fetchReceipt(reference));
    } catch (e: unknown) {
      setReceiptError(errorText(e, "That receipt could not be loaded."));
    } finally {
      setLoadingRef("");
    }
  };

  if (error) return <Empty icon={ReceiptText} title="Activity unavailable" text={error} />;
  if (rows === null)
    return <p className="py-6 text-center text-sm text-muted-foreground">Loading your activity…</p>;
  if (!rows.length)
    return (
      <Empty
        icon={ReceiptText}
        title="No payments yet"
        text="Anything you send or receive with Nella will show up here with its receipt."
      />
    );

  return (
    <div className="space-y-4">
      {receiptError && <p className="text-sm text-destructive">{receiptError}</p>}
      <div className="divide-y divide-border">
        {rows.map((t) => (
          <Button
            key={t.id}
            variant="plain"
            size="none"
            className="flex w-full items-center justify-between gap-3 py-3 text-left"
            onClick={() => void open(t.reference)}
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{t.description}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {new Date(t.createdAt).toLocaleDateString([], {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}{" "}
                · {t.reference}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span
                className={`block text-sm font-bold tabular-nums ${t.type === "credit" ? "text-primary" : ""}`}
              >
                {t.type === "credit" ? "+" : "−"}
                {naira(t.amountMinor / 100)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {loadingRef === t.reference ? "Opening…" : "Receipt"}
              </span>
            </span>
          </Button>
        ))}
      </div>
      {receipt && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-muted-foreground">RECEIPT</p>
              <p className="mt-1 break-words text-sm font-semibold">{receipt.title}</p>
              <p className="mt-1 text-xl font-extrabold tabular-nums">{naira(receipt.amount)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="Close receipt"
              onClick={() => setReceipt(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <dl className="mt-3 space-y-2 text-xs">
            {receipt.rows.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-3">
                <dt className="shrink-0 text-muted-foreground">{key}</dt>
                <dd className="min-w-0 break-all text-right font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function BeneficiariesPanel({ onChange }: { onChange: (panel: AppPanel | null) => void }) {
  const [rows, setRows] = useState<Beneficiary[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    let active = true;
    fetchBeneficiaries()
      .then((list) => {
        if (active) setRows(list);
      })
      .catch((e: unknown) => {
        if (active) setError(errorText(e, "Your beneficiaries could not be loaded right now."));
      });
    return () => {
      active = false;
    };
  }, []);

  const remove = async (b: Beneficiary) => {
    setBusy(`${b.account}.${b.bank}`);
    setError("");
    try {
      await removeBeneficiary(b.account, b.bank);
      setRows((current) =>
        (current ?? []).filter((x) => !(x.account === b.account && x.bank === b.bank)),
      );
    } catch (e: unknown) {
      setError(errorText(e, "That beneficiary could not be removed."));
    } finally {
      setBusy("");
    }
  };

  if (error && !rows)
    return <Empty icon={Landmark} title="Beneficiaries unavailable" text={error} />;
  if (rows === null)
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">Loading your beneficiaries…</p>
    );
  if (!rows.length)
    return (
      <div className="space-y-5">
        <Empty
          icon={Landmark}
          title="No saved beneficiaries"
          text="A recipient is saved automatically after your first payment to them, so their details are here the next time you send."
        />
        <Button className="h-12 w-full" onClick={() => onChange("transfer")}>
          Send money in chat
          <ArrowRight />
        </Button>
      </div>
    );

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="divide-y divide-border">
        {rows.map((b) => (
          <div key={`${b.account}.${b.bank}`} className="flex items-center gap-3 py-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{b.name}</span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {b.account} · {b.bank}
              </span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground"
              aria-label={`Remove ${b.name}`}
              disabled={busy === `${b.account}.${b.bank}`}
              onClick={() => void remove(b)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button className="h-12 w-full" onClick={() => onChange("transfer")}>
        Send money in chat
        <ArrowRight />
      </Button>
    </div>
  );
}

function InsightsPanel({ onChange }: { onChange: (panel: AppPanel | null) => void }) {
  const [totals, setTotals] = useState<{ inMinor: number; outMinor: number; count: number } | null>(
    null,
  );
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetchHistory(1, 100)
      .then((page) => {
        if (!active) return;
        const inMinor = page.transactions
          .filter((t) => t.type === "credit")
          .reduce((n, t) => n + Number(t.amountMinor), 0);
        const outMinor = page.transactions
          .filter((t) => t.type === "debit")
          .reduce((n, t) => n + Number(t.amountMinor), 0);
        setTotals({ inMinor, outMinor, count: page.transactions.length });
      })
      .catch((e: unknown) => {
        if (active) setError(errorText(e, "Your spending could not be loaded right now."));
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Totals from your last {totals?.count ?? 0} transactions.
      </p>
      <dl className="divide-y divide-border text-sm">
        {(
          [
            ["Money in", totals ? naira(totals.inMinor / 100) : "…"],
            ["Money out", totals ? naira(totals.outMinor / 100) : "…"],
          ] as [string, string][]
        ).map(([key, value]) => (
          <div key={key} className="flex justify-between gap-3 py-3">
            <dt className="text-muted-foreground">{key}</dt>
            <dd className="font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Info
        title="Printable statements"
        text="PDF statements are arranged with support while we finish the in-app statement view."
      />
      <Button className="h-12 w-full" onClick={() => onChange("activity")}>
        <ReceiptText />
        View activity &amp; receipts
      </Button>
    </div>
  );
}

function BiometricSetting({ user }: { user: PublicUser }) {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    void biometricsAvailable().then((ok) => {
      if (active) {
        setAvailable(ok);
        setEnabled(hasBiometrics(user.phone));
      }
    });
    return () => {
      active = false;
    };
  }, [user.phone]);
  const toggle = async () => {
    setBusy(true);
    setMessage("");
    try {
      if (enabled) {
        disableBiometrics(user.phone);
        setEnabled(false);
        setMessage("Biometric unlock is off. Your PIN still works.");
      } else {
        await enableBiometrics(user.phone, user.fullName ?? "Nella");
        setEnabled(true);
        setMessage(
          "Biometric unlock is on. Next time you open Nella, use your fingerprint, face or phone unlock to sign in.",
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Biometric setup failed. Your PIN still works.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center gap-3">
        <ScanFace className="h-6 w-6 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-sm font-bold">Biometric unlock</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {available
              ? "Open the app with your fingerprint, face or your phone's unlock method. Payments still need your PIN."
              : "This device doesn't offer biometric unlock here."}
          </p>
        </div>
      </div>
      {available && (
        <Button
          variant={enabled ? "outline" : "default"}
          className="mt-3 h-11 w-full"
          disabled={busy}
          onClick={() => void toggle()}
        >
          {busy
            ? "Waiting for your device…"
            : enabled
              ? "Turn off biometric unlock"
              : "Set up biometric unlock"}
        </Button>
      )}
      {message && (
        <p role="status" className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}

export function PaymentPreviewCard({
  receipt,
  onEdit,
}: {
  receipt: ReceiptPreview;
  onEdit?: ((field: PaymentField) => void) | undefined;
}) {
  const fieldFor = (key: string): PaymentField =>
    key === "Bank" || key === "Provider"
      ? "provider"
      : key === "Narration"
        ? "narration"
        : key === "Plan / package"
          ? "plan"
          : "destination";
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-bold text-muted-foreground">PAYMENT BREAKDOWN</p>
      <h3 className="mt-2 text-sm font-semibold">{receipt.title}</h3>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="min-w-0 break-all text-2xl font-extrabold">{naira(receipt.amount)}</p>
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit amount"
            title="Edit amount"
            className="h-11 w-11 shrink-0"
            onClick={() => onEdit("amount")}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>
      <dl className="mt-3 space-y-2 text-xs">
        {receipt.rows
          .filter(([key]) =>
            [
              "Recipient account",
              "Phone number",
              "Meter number",
              "Smartcard number",
              "Bank",
              "Provider",
              "Narration",
              "Plan / package",
            ].includes(key),
          )
          .map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{key}</dt>
              <dd className="flex min-w-0 items-center gap-1 text-right font-semibold">
                <span className="min-w-0 break-all">{value}</span>
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0"
                    aria-label={`Edit ${key.toLowerCase()}`}
                    title={`Edit ${key.toLowerCase()}`}
                    onClick={() => onEdit(fieldFor(key))}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </dd>
            </div>
          ))}
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">Not sent · No money has moved.</p>
    </div>
  );
}
function Action({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" className="h-12 w-full justify-between px-0" onClick={onClick}>
      {label}
      <ArrowRight />
    </Button>
  );
}
function Info({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-l-2 border-primary bg-secondary/50 px-3 py-3">
      <p className="flex items-center gap-2 text-xs font-bold">
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
        {title}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
function Empty({ icon: Icon, title, text }: { icon: typeof Bell; title: string; text: string }) {
  return (
    <div className="py-6 text-center">
      <Icon className="mx-auto mb-3 h-8 w-8 text-primary" />
      <h3 className="font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
