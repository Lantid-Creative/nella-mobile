import { demoReply } from "./demo-store";
import { parsePaymentRequest } from "./payment-request";
import { paymentPreview, validatePaymentDraft, type MoneyService, type PaymentDraft, type ReceiptPreview } from "./app-provisions";

export type PaymentField = "provider" | "destination" | "plan" | "amount" | "narration";
export type PaymentConversation = { draft: PaymentDraft; field: PaymentField | "review"; editing?: boolean };
type Turn = { state: PaymentConversation | null; text: string; preview?: ReceiptPreview; choices?: string[] };
const banks = ["GTBank", "Access Bank", "Zenith Bank", "UBA", "First Bank", "OPay", "Moniepoint", "PalmPay", "Kuda", "Wema Bank", "VFD", "Fidelity", "Sterling", "Union", "Stanbic", "FCMB"];
const providers: Record<MoneyService, string[]> = { transfer: banks, airtime: ["MTN", "Airtel", "Glo", "9mobile"], data: ["MTN", "Airtel", "Glo", "9mobile"], electricity: ["Ikeja Electric", "Eko Electric", "Abuja Electric", "Ibadan Electric"], cable: ["DStv", "GOtv", "StarTimes"] };
export function paymentService(text: string): MoneyService | "services" | null {
  if (/\b(refund|dispute|complaint|pin|recover|freeze|business|payroll|invoice)\b/i.test(text)) return null;
  if (/\b(airtime|recharge)\b/i.test(text)) return "airtime";
  if (/\bdata\b/i.test(text)) return "data";
  if (/\b(electricity|electric|nepa|meter|prepaid|postpaid)\b/i.test(text)) return "electricity";
  if (/\b(cable|dstv|gotv|startimes)\b/i.test(text)) return "cable";
  if (/\b(send|transfer)\b/i.test(text) || /\b\d{10}\b/.test(text)) return "transfer";
  if (/\b(pay|money services)\b/i.test(text)) return "services";
  return null;
}
const questions = (draft: PaymentDraft): Record<PaymentField, string> => ({
  provider: draft.service === "transfer" ? "Which bank is the recipient using?" : draft.service === "electricity" || draft.service === "cable" ? "Who is your bill provider?" : "Which network?",
  destination: draft.service === "transfer" ? "What’s the recipient’s 10-digit account number?" : draft.service === "electricity" ? "What’s the meter number?" : draft.service === "cable" ? "What’s the smartcard number?" : "What phone number should I use?",
  plan: draft.service === "electricity" ? "Is the meter prepaid or postpaid?" : draft.service === "cable" ? "Which package would you like? Availability isn’t verified yet." : "Which data plan would you like? Availability isn’t verified yet.",
  amount: "How much in naira?",
  narration: "What’s this transfer for? You can skip the narration.",
});
const dataPlans = ["1GB · 1 day", "2GB · 7 days", "5GB · 30 days", "10GB · 30 days", "25GB · 30 days"];
const cablePlans = ["DStv Padi", "DStv Yanga", "DStv Compact", "GOtv Smallie", "GOtv Jinja", "GOtv Max", "StarTimes Nova", "StarTimes Classic"];
function choices(state: PaymentConversation): string[] {
  if (state.field === "provider") return providers[state.draft.service];
  if (state.field === "plan") {
    if (state.draft.service === "electricity") return ["Prepaid", "Postpaid"];
    if (state.draft.service === "data") return dataPlans;
    if (state.draft.service === "cable") return cablePlans.filter(plan => !state.draft.provider || plan.toLowerCase().startsWith(state.draft.provider.toLowerCase()));
  }
  if (state.field === "narration") return ["Rent", "Family", "Skip"];
  if (state.field === "review") return ["Approve payment", "Edit details", "Cancel"];
  return [];
}
function next(draft: PaymentDraft, sender: string, narrationDone = false): Turn {
  const fields: PaymentField[] = ["provider", "destination", ...(["data", "cable", "electricity"].includes(draft.service) ? ["plan" as const] : []), "amount"];
  const field = fields.find(key => !draft[key]) ?? (draft.service === "transfer" && !narrationDone && !draft.narration ? "narration" : "review");
  const state: PaymentConversation = { draft, field };
  if (field !== "review") return { state, text: questions(draft)[field], choices: choices(state) };
  const error = validatePaymentDraft(draft);
  if (error) return { state: { draft, field: "amount" }, text: `${error} How much in naira?` };
  return { state, text: "Here are your details. Nothing has been paid. The recipient and any fees still need verification. You can change the details here in chat. Never send your banking PIN.", preview: paymentPreview(draft, sender), choices: choices(state) };
}
export function startPayment(service: MoneyService, raw: string, sender: string, seed?: PaymentDraft, customerPhone?: string): Turn {
  const draft: PaymentDraft = seed ? { ...seed } : { service, provider: "", destination: "", plan: "", amount: "", narration: "" };
  // Keep the existing complete-message payment parser as the source of transfer/mobile details.
  const parsed = demoReply(raw).flatMap(part => part.card?.kind === "approval" ? [part.card] : part.card?.kind === "narration" ? [part.card.pending] : [])[0];
  if (parsed && parsed.service === service) Object.assign(draft, { amount: String(parsed.amount), provider: parsed.bank, destination: parsed.account });
  if (!seed) {
    const details = parsePaymentRequest(service, raw, customerPhone);
    Object.assign(draft, details);
    // A legacy parser may mistake a data-plan size for money; only keep an
    // amount explicitly identified by the conversational parser.
    draft.amount = details.amount ?? "";
  }
  return next(draft, sender);
}
export function answerPayment(state: PaymentConversation, raw: string, sender: string, customerPhone?: string): Turn {
  const text = raw.trim();
  if (/^(cancel|stop|never mind)$/i.test(text)) return { state: null, text: "Cancelled. No payment was submitted." };
  const edit = text.match(/^(?:edit|change)\s+(amount|bank|provider|account|phone|meter|smartcard|number|plan|package|narration)(?:\s+(?:to\s+)?(.+))?$/i);
  if (/^edit details$/i.test(text)) return { state, text: "What would you like to change?", choices: ["Change amount", "Change provider", "Change number", ...(state.draft.service === "transfer" ? ["Change narration"] : state.draft.service !== "airtime" ? ["Change plan"] : [])] };
  if (edit?.[1]) {
    const key = edit[1].toLowerCase();
    const field: PaymentField = key === "bank" || key === "provider" ? "provider" : ["account", "phone", "meter", "smartcard", "number"].includes(key) ? "destination" : key === "package" || key === "plan" ? "plan" : key === "narration" ? "narration" : "amount";
    const updated = { ...state, field, editing: true };
    return edit[2] ? answerPayment(updated, edit[2], sender, customerPhone) : { state: updated, text: questions(state.draft)[field], choices: choices(updated) };
  }
  if (state.field === "review") return { state, text: "Payments aren’t connected yet. You can edit these details or cancel. No payment has been submitted.", choices: choices(state) };
  const draft = { ...state.draft };
  if (state.field !== "narration") {
    const extracted = parsePaymentRequest(draft.service, text, customerPhone);
    const details = state.editing ? (extracted[state.field] ? { [state.field]: extracted[state.field] } : {}) : extracted;
    // A standalone numeric reply belongs to the field currently being asked.
    if (state.field !== "amount" && /^\d+(?:\.\d+)?$/.test(text)) delete details.amount;
    if (Object.keys(details).length) {
      Object.assign(draft, details);
      const amountError = draft.amount && (!Number.isFinite(Number(draft.amount)) || Number(draft.amount) <= 0
        ? "Please send an amount greater than zero."
        : (draft.service === "transfer" || draft.service === "electricity") && Number(draft.amount) < 100 ? "The minimum amount is ₦100." : "");
      if (amountError) return { state: { draft: { ...draft, amount: "" }, field: "amount" }, text: `${amountError} How much in naira?` };
      return next(draft, sender, state.editing === true);
    }
  }
  let error = "";
  if (state.field === "amount") {
    const match = text.replace(/,/g, "").match(/^(?:₦|NGN|naira)?\s*(\d+(?:\.\d{1,2})?)\s*(k)?(?:\s*naira)?$/i);
    const amount = match?.[1] ? Number(match[1]) * (match[2] ? 1000 : 1) : NaN;
    if (!Number.isFinite(amount) || amount <= 0) error = "Please send an amount greater than zero.";
    else if ((draft.service === "transfer" || draft.service === "electricity") && amount < 100) error = "The minimum amount is ₦100.";
    else draft.amount = String(amount);
  } else if (state.field === "destination") {
    const number = text.replace(/[\s-]/g, "");
    const valid = draft.service === "transfer" ? /^\d{10}$/ : draft.service === "airtime" || draft.service === "data" ? /^0[789][01]\d{8}$/ : /^\d{6,20}$/;
    if (!valid.test(number)) error = "That number doesn’t look right.";
    else draft.destination = number;
  } else if (state.field === "plan" && draft.service === "electricity") {
    if (!/^(prepaid|postpaid)$/i.test(text)) error = "Please choose prepaid or postpaid.";
    else draft.plan = text;
  } else if (state.field === "narration") draft.narration = /^skip$/i.test(text) ? "" : text.slice(0, 100);
  else draft[state.field] = text.slice(0, 80);
  if (error) return { state, text: `${error} ${questions(draft)[state.field]}`, choices: choices(state) };
  return next(draft, sender, state.field === "narration" || Boolean(state.draft.amount));
}