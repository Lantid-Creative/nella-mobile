// Demo-only storage in this browser. No real bank, no real money.
export type DemoUser = { name: string; phone: string; pin: string };

export type Card =
  | { kind: "balance"; amount: string }
  | { kind: "narration"; done?: boolean }
  | {
      kind: "approval";
      service: "transfer" | "airtime" | "data";
      amount: number;
      account: string;
      bank: string;
      narration?: string;
      status: "pending" | "approved" | "cancelled";
    }
  | { kind: "receipt"; title: string; amount: number; rows: [string, string][] };

export type ChatMsg = { id: string; role: "user" | "nella"; text?: string; card?: Card; at: number };

const USERS = "nella.users.v2";
const SESSION = "nella.session.v2";
const chatKey = (phone: string) => `nella.chat.v2.${phone}`;

const read = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

/** Normalise Nigerian numbers to 10 digits after +234 (e.g. 8012345678). */
export function normalisePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("234")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return /^[789][01]\d{8}$/.test(d) ? d : null;
}

export function signUp(name: string, phoneRaw: string, pin: string) {
  const phone = normalisePhone(phoneRaw);
  if (!phone) throw new Error("Enter a valid Nigerian phone number.");
  if (!/^\d{4}$/.test(pin)) throw new Error("Your PIN must be 4 digits.");
  const users = read<DemoUser[]>(USERS, []);
  if (users.some((u) => u.phone === phone)) throw new Error("This number already has an account. Log in instead.");
  users.push({ name: name.trim(), phone, pin });
  localStorage.setItem(USERS, JSON.stringify(users));
  localStorage.setItem(SESSION, phone);
}

export function signIn(phoneRaw: string, pin: string) {
  const phone = normalisePhone(phoneRaw);
  const u = read<DemoUser[]>(USERS, []).find((x) => x.phone === phone);
  if (!u || u.pin !== pin) throw new Error("Wrong phone number or PIN.");
  localStorage.setItem(SESSION, u.phone);
}

export const signOut = () => localStorage.removeItem(SESSION);

export function currentUser(): DemoUser | null {
  const p = localStorage.getItem(SESSION);
  if (!p) return null;
  return read<DemoUser[]>(USERS, []).find((u) => u.phone === p) ?? null;
}

export const checkPin = (u: DemoUser, pin: string) => u.pin === pin;
export const loadChat = (phone: string) => read<ChatMsg[]>(chatKey(phone), []);
export const saveChat = (phone: string, msgs: ChatMsg[]) =>
  localStorage.setItem(chatKey(phone), JSON.stringify(msgs));

export const naira = (n: number) =>
  "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const BANKS = ["GTBank", "Access", "Zenith", "UBA", "First Bank", "Opay", "Moniepoint", "Palmpay", "Kuda", "Wema", "Fidelity", "Sterling", "Union", "Stanbic", "FCMB", "VFD"];
const NETWORKS = ["MTN", "Airtel", "Glo", "9mobile"];

function parseAmount(t: string): number | null {
  const m = t.replace(/,/g, "").match(/(?:₦|n|naira\s*)?(\d+(?:\.\d+)?)\s*(k)?\b/i);
  if (!m) return null;
  const n = parseFloat(m[1]) * (m[2] ? 1000 : 1);
  return n > 0 ? n : null;
}

/** Turns a customer's message into Nella's demo reply (text and/or card). */
export function demoReply(text: string): Omit<ChatMsg, "id" | "at" | "role">[] {
  const t = text.toLowerCase();
  const account = text.match(/\b\d{10}\b/)?.[0];
  const phone = text.match(/\b0[789][01]\d{8}\b/)?.[0];

  if (/balance|how much.*(have|left)/.test(t))
    return [{ text: "Here's your wallet balance:", card: { kind: "balance", amount: naira(48250) } }];

  if (/airtime|recharge|data/.test(t)) {
    const service = /data/.test(t) ? "data" : "airtime";
    const amount = parseAmount(text.replace(phone ?? "", ""));
    const net = NETWORKS.find((n) => t.includes(n.toLowerCase()));
    if (!amount || !phone)
      return [{ text: `Sure — tell me the amount and the number, e.g. "₦1,000 ${service} to 08012345678 MTN".` }];
    return [{ text: "Please check and approve:", card: { kind: "approval", service, amount, account: phone, bank: net ?? "Network detected on approval", status: "pending" } }];
  }

  if (/electric|nepa|prepaid|meter|dstv|gotv|startimes|cable|bill/.test(t))
    return [{ text: "I can pay electricity and cable TV (DSTV, GOtv, StarTimes). Tell me the biller, the meter or smartcard number and the amount. Bill payments are coming to this app soon." }];

  if (/send|transfer|pay\b|sent/.test(t) || account) {
    const amount = parseAmount(text.replace(account ?? "", ""));
    const bank = BANKS.find((b) => t.includes(b.toLowerCase()));
    if (!amount || !account || !bank)
      return [{ text: 'Who should I send to? Type it like "₦5,000 to 0123456789 GTBank". You can also snap a photo of the account details.' }];
    return [{ text: "What is this transfer for? It shows on the receipt and bank narration.", card: { kind: "narration" } }, { card: { kind: "approval", service: "transfer", amount, account, bank, status: "pending" } }];
  }

  if (/^(hi|hello|hey|good (morning|afternoon|evening))/.test(t))
    return [{ text: "Hi! I'm Nella. I can send money, buy airtime and data, pay bills and check your balance — just tell me what you need." }];

  if (/support|help|agent/.test(t))
    return [{ text: "Our team is here for you. In the live app, \"support\" connects you to a person." }];

  return [{ text: 'I didn\'t quite get that. Try "check my balance", "send ₦5,000 to 0123456789 GTBank" or "₦1,000 airtime to 08012345678".' }];
}
