export type MoneyService = "transfer" | "airtime" | "data" | "electricity" | "cable";
export type AppPanel =
  | MoneyService
  | "services"
  | "account"
  | "onboarding"
  | "activity"
  | "notifications"
  | "beneficiaries"
  | "scheduled"
  | "security"
  | "support"
  | "insights"
  | "business"
  | "referrals";

export const SERVICE_LABELS: Record<MoneyService, string> = {
  transfer: "Send money",
  airtime: "Buy airtime",
  data: "Buy data",
  electricity: "Electricity",
  cable: "Cable TV",
};

/** Presentation-only intents. Existing detailed payment parsing remains unchanged. */
export function panelForMessage(raw: string): AppPanel | null {
  const text = raw.trim().toLowerCase();
  if (/\b(refund|dispute|complaint)\b/.test(text)) return "support";
  if (
    /\b(forgot|reset|change)\s+(?:my\s+|payment\s+)?pin\b|\b(recover|freeze|unblock)\s+(?:my\s+)?account\b/.test(
      text,
    )
  )
    return "security";
  if (/^(send money|transfer money)$/.test(text)) return "transfer";
  if (/^(buy airtime|recharge)$/.test(text)) return "airtime";
  if (/^(buy data|data plans)$/.test(text)) return "data";
  if (/^(pay a bill|pay bills|electricity)$/.test(text)) return "services";
  if (/^(cable|cable tv)$/.test(text)) return "cable";
  if (/\b(fund|funding)\b|\baccount details\b|\bmy account\b/.test(text)) return "account";
  if (/onboard|verify.*identity|verification|complete.*setup/.test(text)) return "onboarding";
  if (/notification|alerts/.test(text)) return "notifications";
  if (/recent activity|transaction history|receipts/.test(text)) return "activity";
  if (/beneficiar/.test(text)) return "beneficiaries";
  if (/scheduled|reminder/.test(text)) return "scheduled";
  if (/security|change pin|freeze|unblock/.test(text)) return "security";
  if (/support|help|agent/.test(text)) return "support";
  if (/spending|insights|statement/.test(text)) return "insights";
  if (/invoice|payroll|business|payment request|bulk/.test(text)) return "business";
  if (/\b(refer|referral|referrals|ambassador|ambassadors)\b/.test(text)) return "referrals";
  return null;
}

export type PaymentDraft = {
  service: MoneyService;
  amount: string;
  destination: string;
  provider: string;
  narration: string;
  plan: string;
};
export function validatePaymentDraft(draft: PaymentDraft): string | null {
  const amount = Number(draft.amount);
  if (!Number.isFinite(amount) || amount <= 0) return "Enter an amount greater than zero.";
  if ((draft.service === "transfer" || draft.service === "electricity") && amount < 100)
    return "The minimum amount is ₦100.";
  if (!draft.provider.trim()) return "Choose a bank or provider.";
  if (draft.service === "transfer" && !/^\d{10}$/.test(draft.destination))
    return "Enter a 10-digit account number.";
  if (
    (draft.service === "airtime" || draft.service === "data") &&
    !/^0[789][01]\d{8}$/.test(draft.destination)
  )
    return "Enter a valid Nigerian phone number.";
  if (
    (draft.service === "electricity" || draft.service === "cable") &&
    !/^\d{6,20}$/.test(draft.destination)
  )
    return "Enter the meter or smartcard number.";
  if ((draft.service === "data" || draft.service === "cable") && !draft.plan.trim())
    return "Select a plan or package.";
  if (draft.service === "electricity" && !draft.plan.trim()) return "Choose prepaid or postpaid.";
  return null;
}

export type ReceiptPreview = { title: string; amount: number; rows: [string, string][] };
export function paymentPreview(draft: PaymentDraft, sender: string): ReceiptPreview {
  return {
    title: SERVICE_LABELS[draft.service],
    amount: Number(draft.amount),
    rows: [
      ["Status", "Not sent — awaiting your approval"],
      ["Sender", sender],
      [
        draft.service === "transfer"
          ? "Recipient account"
          : draft.service === "electricity"
            ? "Meter number"
            : draft.service === "cable"
              ? "Smartcard number"
              : "Phone number",
        draft.destination,
      ],
      [draft.service === "transfer" ? "Bank" : "Provider", draft.provider],
      ...(draft.plan ? [["Plan / package", draft.plan] as [string, string]] : []),
      ...(draft.narration ? [["Narration", draft.narration] as [string, string]] : []),
      ["Recipient name", "Awaiting provider verification"],
      ["Fee", "Awaiting provider quote"],
      ["Reference", "Not issued"],
      ["Session ID", "Not issued"],
    ],
  };
}

export function previewReceiptText(receipt: ReceiptPreview): string {
  return [
    "NELLA — PAYMENT PREVIEW",
    "NOT A PROOF OF PAYMENT",
    receipt.title,
    `NGN ${receipt.amount.toFixed(2)}`,
    ...receipt.rows.map(([key, value]) => `${key}: ${value}`),
  ].join("\n");
}
