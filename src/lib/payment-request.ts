import type { MoneyService } from "./app-provisions";

/** Extracts naive payment details from free text. No live provider calls. */
export function parsePaymentRequest(service: MoneyService, text: string, customerPhone?: string): Partial<Record<string, string>> {
  const t = text.trim();
  const details: Record<string, string> = {};

  const phoneMatch = t.match(/\b0[789][01]\d{8}\b/);
  const accountMatch = t.match(/\b\d{10}\b/);

  // Self-purchase: target the customer's own phone when no explicit destination is given.
  if (service === "airtime" || service === "data") {
    if (phoneMatch) details.destination = phoneMatch[0];
    else if (customerPhone) details.destination = customerPhone;
  }

  if (service === "transfer") {
    if (accountMatch) details.destination = accountMatch[0];
    else if (phoneMatch) details.destination = phoneMatch[0];
  }

  if (service === "electricity" || service === "cable") {
    // Meter / smartcard numbers are 6-20 digits.
    const meterMatch = t.match(/\b\d{6,20}\b/);
    if (meterMatch) details.destination = meterMatch[0];
  }

  // Amount: find ₦N or N k/naira patterns.
  const amountMatch = t.replace(/,/g, "").match(/(?:₦|NGN|naira\s*)?(\d+(?:\.\d{1,2})?)\s*(k)?/i);
  if (amountMatch) {
    const n = parseFloat(amountMatch[1]) * (amountMatch[2] ? 1000 : 1);
    if (n > 0) details.amount = String(n);
  }

  // Bank / provider name hints.
  const banks = ["GTBank", "Access Bank", "Zenith Bank", "UBA", "First Bank", "OPay", "Moniepoint", "PalmPay", "Kuda", "Wema Bank", "VFD", "Fidelity", "Sterling", "Union", "Stanbic", "FCMB"];
  const bank = banks.find((b) => t.toLowerCase().includes(b.toLowerCase()));
  if (bank) details.provider = bank;

  const networks = ["MTN", "Airtel", "Glo", "9mobile"];
  const net = networks.find((n) => t.toLowerCase().includes(n.toLowerCase()));
  if (net) details.provider = net;

  const electricityProviders = ["Ikeja Electric", "Eko Electric", "Abuja Electric", "Ibadan Electric"];
  const ep = electricityProviders.find((p) => t.toLowerCase().includes(p.toLowerCase()));
  if (ep) details.provider = ep;

  const cableProviders = ["DStv", "GOtv", "StarTimes"];
  const cp = cableProviders.find((p) => t.toLowerCase().includes(p.toLowerCase()));
  if (cp) details.provider = cp;

  // Plan hints.
  if (service === "electricity") {
    if (/postpaid/i.test(t)) details.plan = "Postpaid";
    else if (/prepaid/i.test(t)) details.plan = "Prepaid";
  }

  return details;
}
