import { normalisePhone } from "./demo-store";
import type { MoneyService, PaymentDraft } from "./app-provisions";

const bankAliases: [string, RegExp][] = [
  ["GTBank", /\b(?:gtb|gtbank|gt bank|guaranty trust(?: bank)?)\b/i],
  ["Access Bank", /\baccess(?: bank)?\b/i], ["Zenith Bank", /\bzenith(?: bank)?\b/i],
  ["UBA", /\b(?:uba|united bank for africa)\b/i], ["First Bank", /\b(?:first ?bank|fbn)\b/i],
  ["OPay", /\bopay\b/i], ["Moniepoint", /\bmoniepoint\b/i], ["PalmPay", /\bpalmpay\b/i],
  ["Kuda", /\bkuda\b/i], ["Wema Bank", /\bwema(?: bank)?\b/i], ["VFD", /\bvfd\b/i],
  ["Fidelity", /\bfidelity(?: bank)?\b/i], ["Sterling", /\bsterling(?: bank)?\b/i],
  ["Union", /\bunion(?: bank)?\b/i], ["Stanbic", /\bstanbic(?: ibtc)?\b/i], ["FCMB", /\bfcmb\b/i],
];

/** Extract only explicit editable details; never guess a network, plan or approval. */
export function parsePaymentRequest(service: MoneyService, raw: string, customerPhone?: string): Partial<PaymentDraft> {
  const details: Partial<PaymentDraft> = {};
  const provider = service === "transfer" ? bankAliases.find(([, pattern]) => pattern.test(raw))?.[0]
    : raw.match(service === "airtime" || service === "data" ? /\b(MTN|Airtel|Glo|9mobile)\b/i
      : service === "cable" ? /\b(DStv|GOtv|StarTimes)\b/i : /\b(Ikeja|Eko|Abuja|Ibadan) Electric\b/i)?.[0];
  if (provider) details.provider = provider;
  const number = raw.match(service === "transfer" ? /\b\d{10}\b/
    : service === "airtime" || service === "data" ? /(?:\+?234[789][01]\d{8}|\b0[789][01]\d{8})\b/ : /\b\d{6,20}\b/)?.[0];
  if (number) {
    const phone = normalisePhone(number);
    details.destination = service === "airtime" || service === "data" ? (phone ? `0${phone}` : undefined) : number;
  } else if ((service === "airtime" || service === "data") && /\b(?:for me|my (?:phone|number|line)|myself)\b/i.test(raw)) {
    const phone = customerPhone ? normalisePhone(customerPhone) : null;
    if (phone) details.destination = `0${phone}`;
  }
  const plan = service === "electricity" ? raw.match(/\b(prepaid|postpaid)\b/i)?.[0]
    : service === "data" ? raw.match(/\b\d+(?:\.\d+)?\s*(?:GB|MB)\b/i)?.[0] : undefined;
  if (plan) details.plan = plan;
  // Remove recipient and plan numbers before looking for money. Bare numbers are
  // amounts only with payment context, currency or an unambiguous standalone reply.
  const remainder = raw.replace(number ?? /$^/, "").replace(plan ?? /$^/, "").replace(/,/g, "");
  const amount = remainder.match(/(?:₦|\bNGN\s*|\bnaira\s*|\b(?:send|transfer|pay|buy|recharge|amount|for|of)\s+)(\d+(?:\.\d{1,2})?)\s*(k)?\b/i)
    ?? remainder.match(/\b(\d+(?:\.\d{1,2})?)\s*(k)?\s*(?:naira|airtime|recharge)\b/i)
    ?? remainder.match(/^\s*(\d+(?:\.\d{1,2})?)\s*(k)?\s*$/i);
  if (amount?.[1]) details.amount = String(Number(amount[1]) * (amount[2] ? 1000 : 1));
  return details;
}