// Demo-only storage in this browser. No real bank, no real money.
import type { ReceiptPreview } from "./app-provisions";
import { z } from "zod";
import { readDemoValue, writeDemoValue, removeDemoValue, STORAGE_NOTICE } from "./demo-storage";
export type DemoUser = { name: string; phone: string; pin: string; onboardingComplete?: boolean; kycSetupComplete?: boolean };

export type ApprovalCard = {
  kind: "approval";
  service: "transfer" | "airtime" | "data";
  amount: number;
  account: string;
  bank: string;
  narration?: string | undefined;
  status: "pending" | "approved" | "cancelled";
};

export type Card =
  | { kind: "preview"; preview: ReceiptPreview }
  | { kind: "balance"; amount: string }
  | { kind: "narration"; pending: ApprovalCard; done?: boolean | undefined }
  | ApprovalCard
  | { kind: "receipt"; title: string; amount: number; rows: [string, string][] };

export type ChatMedia = {
  kind: "image" | "audio";
  label: string;
  previewUrl?: string | undefined;
  durationSeconds?: number | undefined;
};

export type ChatMsg = {
  id: string;
  role: "user" | "nella";
  text?: string | undefined;
  card?: Card | undefined;
  media?: ChatMedia | undefined;
  replyTo?: { id: string; role: "user" | "nella"; text: string } | undefined;
  reactions?: string[] | undefined;
  at: number;
};

const USERS = "nella.users.v2";
const SESSION = "nella.session.v2";
const chatKey = (phone: string) => `nella.chat.v2.${phone}`;

const userSchema = z.object({ name: z.string().trim().min(1), phone: z.string().regex(/^[789][01]\d{8}$/), pin: z.string().regex(/^\d{4}$/), onboardingComplete: z.boolean().default(false), kycSetupComplete: z.boolean().default(false) });
const approvalSchema = z.object({ kind: z.literal("approval"), service: z.enum(["transfer", "airtime", "data"]), amount: z.number().finite().positive(), account: z.string(), bank: z.string(), narration: z.string().optional(), status: z.enum(["pending", "approved", "cancelled"]) });
const receiptSchema = z.object({ title: z.string(), amount: z.number().finite().positive(), rows: z.array(z.tuple([z.string(), z.string()])) });
const messageSchema = z.object({
  id: z.string(), role: z.enum(["user", "nella"]), text: z.string().optional(), at: z.number().finite(),
  card: z.union([approvalSchema, z.object({ kind: z.literal("preview"), preview: receiptSchema }), z.object({ kind: z.literal("balance"), amount: z.string() }), z.object({ kind: z.literal("narration"), pending: approvalSchema, done: z.boolean().optional() }), receiptSchema.extend({ kind: z.literal("receipt") })]).optional(),
  media: z.object({ kind: z.enum(["image", "audio"]), label: z.string(), previewUrl: z.string().optional(), durationSeconds: z.number().finite().optional() }).optional(),
  replyTo: z.object({ id: z.string(), role: z.enum(["user", "nella"]), text: z.string().max(200) }).optional(),
  reactions: z.array(z.string().max(8)).max(5).optional(),
});
const readUsers = (): DemoUser[] => {
  const raw = readDemoValue(USERS);
  if (!Array.isArray(raw)) return [];
  return raw.flatMap(value => { const parsed = userSchema.safeParse(value); return parsed.success ? [parsed.data] : []; });
};
const persistUsers = (users: DemoUser[]) => {
  if (!writeDemoValue(USERS, users)) throw new Error(STORAGE_NOTICE);
};
const setSession = (phone: string) => {
  try { localStorage.setItem(SESSION, phone); } catch { throw new Error(STORAGE_NOTICE); }
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
  const users = readUsers();
  if (users.some((u) => u.phone === phone))
    throw new Error("This number already has an account. Log in instead.");
  if (name.trim().split(/\s+/).length < 2) throw new Error("Enter your first and last name.");
  users.push({ name: name.trim(), phone, pin, onboardingComplete: false });
  persistUsers(users);
  setSession(phone);
}

export function signIn(phoneRaw: string, pin: string) {
  const phone = normalisePhone(phoneRaw);
  // Only the fixed test credentials provision the ready demo account.
  // Existing accounts, including their PIN and setup state, remain unchanged.
  if (phone === DEMO_PHONE && pin === DEMO_PIN && !readUsers().some((user) => user.phone === phone)) {
    seedDemoLogin();
    return;
  }
  const u = readUsers().find((x) => x.phone === phone);
  if (!u || u.pin !== pin) throw new Error("Wrong phone number or PIN.");
  setSession(u.phone);
}

/** Signs in after the device has verified the owner with its biometric unlock (demo only). */
export function signInVerified(phoneRaw: string) {
  const phone = normalisePhone(phoneRaw);
  const u = phone ? readUsers().find((x) => x.phone === phone) : undefined;
  if (!u) throw new Error("No demo account was found for this number in this browser.");
  setSession(u.phone);
}

export function resetDemoPin(phoneRaw: string, pin: string) {
  const phone = normalisePhone(phoneRaw);
  if (!phone) throw new Error("Enter the phone number used for this demo account.");
  if (!/^\d{4}$/.test(pin)) throw new Error("Your new PIN must be 4 digits.");

  const users = readUsers();
  const user = users.find((candidate) => candidate.phone === phone);
  if (!user) throw new Error("No demo account was found for this number in this browser.");

  user.pin = pin;
  persistUsers(users);
}

export const signOut = () => removeDemoValue(SESSION);

export const DEMO_PHONE = "8012345678";
export const DEMO_PIN = "1234";

/** Seeds (or reuses) a ready demo account with onboarding and KYC complete, then signs in. Demo only. */
export function seedDemoLogin() {
  const users = readUsers();
  let user = users.find((candidate) => candidate.phone === DEMO_PHONE);
  if (!user) {
    user = { name: "Demo Customer", phone: DEMO_PHONE, pin: DEMO_PIN, onboardingComplete: true, kycSetupComplete: true };
    users.push(user);
  } else {
    user.onboardingComplete = true;
    user.kycSetupComplete = true;
  }
  persistUsers(users);
  setSession(DEMO_PHONE);
}

export function currentUser(): DemoUser | null {
  let p: string | null;
  try { p = localStorage.getItem(SESSION); } catch { return null; }
  if (!p) return null;
  return readUsers().find((u) => u.phone === p) ?? null;
}

export const checkPin = (u: DemoUser, pin: string) => u.pin === pin;

/** Demo onboarding is not live identity verification or banking authorization. */
export function completeDemoKyc() {
  const active = currentUser();
  if (!active) throw new Error("Log in to finish your KYC setup.");
  const users = readUsers();
  const user = users.find(candidate => candidate.phone === active.phone);
  if (!user) throw new Error("Your account could not be found.");
  user.kycSetupComplete = true;
  persistUsers(users);
}

export function completeOnboarding() {
  const active = currentUser();
  if (!active) throw new Error("Log in to finish your account setup.");
  const users = readUsers();
  const user = users.find(candidate => candidate.phone === active.phone);
  if (!user) throw new Error("Your account could not be found.");
  if (!user.kycSetupComplete) throw new Error("Complete KYC setup before entering chat.");
  user.onboardingComplete = true;
  persistUsers(users);
}

export const canEnterChat = (user: DemoUser | null): boolean => user?.onboardingComplete === true && user.kycSetupComplete === true;

const LEGACY_CHAT_COPY: Record<string, string> = {
  "Bill photo · preview only": "Payment photo",
  "Voice note · preview only": "Voice note",
  "I’ve received this voice note in the preview, but I can’t transcribe it here. No audio was uploaded and no payment was started.":
    "Voice messages can’t be transcribed right now. Please type your request instead.",
  "I can’t read payment details from photos in this preview. Please type the biller and amount instead. Nothing has been paid.":
    "I can’t read payment details from this photo yet. Enter the biller and amount to continue. No payment has been made.",
  "Your real activity and receipts will appear here after the live account is connected. This preview does not have transaction history.":
    "Your activity and receipts are currently unavailable.",
  "Support chat isn’t connected in this preview. In the live app, this is where you’ll be able to reach the support team.":
    "Support chat is currently unavailable.",
};

export const loadChat = (phone: string) => {
  const raw = readDemoValue(chatKey(phone));
  const messages: ChatMsg[] = Array.isArray(raw) ? raw.flatMap(value => { const parsed = messageSchema.safeParse(value); return parsed.success ? [parsed.data] : []; }) : [];
  return messages.map((message): ChatMsg => {
    if (!message.media) {
      if (message.text === undefined) return message;
      const migratedText = LEGACY_CHAT_COPY[message.text];
      return migratedText === undefined ? message : { ...message, text: migratedText };
    }

    const { previewUrl: _previewUrl, ...media } = message.media;
    media.label = message.media.kind === "image" ? "Image attachment" : "Voice attachment";
    const migratedMessage: ChatMsg = { ...message, media };
    if (message.text !== undefined) {
      migratedMessage.text = LEGACY_CHAT_COPY[message.text] ?? message.text;
    }
    return migratedMessage;
  });
};

export const saveChat = (phone: string, msgs: ChatMsg[]) => {
  const persistentMessages = msgs.map((message) => {
    if (!message.media) return message;
    const { previewUrl: _previewUrl, ...media } = message.media;
    media.label = message.media.kind === "image" ? "Image attachment" : "Voice attachment";
    return { ...message, media };
  });
  return writeDemoValue(chatKey(phone), persistentMessages);
};

export const naira = (n: number) =>
  "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const BANKS = [
  "GTBank",
  "Access",
  "Zenith",
  "UBA",
  "First Bank",
  "Opay",
  "Moniepoint",
  "Palmpay",
  "Kuda",
  "Wema",
  "Fidelity",
  "Sterling",
  "Union",
  "Stanbic",
  "FCMB",
  "VFD",
];
const NETWORKS = ["MTN", "Airtel", "Glo", "9mobile"];

function parseAmount(t: string): number | null {
  const m = t.replace(/,/g, "").match(/(?:₦|n|naira\s*)?(\d+(?:\.\d+)?)\s*(k)?\b/i);
  const numericAmount = m?.[1];
  if (!numericAmount) return null;
  const n = parseFloat(numericAmount) * (m[2] ? 1000 : 1);
  return n > 0 ? n : null;
}

/** Turns a customer's message into Nella's demo reply (text and/or card). */
export function demoReply(text: string): Omit<ChatMsg, "id" | "at" | "role">[] {
  const t = text.toLowerCase();
  const account = text.match(/\b\d{10}\b/)?.[0];
  const phone = text.match(/\b0[789][01]\d{8}\b/)?.[0];

  if (/voice note|voice message/.test(t))
    return [
      {
        text: "Voice messages can’t be transcribed right now. Please type your request instead.",
      },
    ];

  if (/snapped a bill|payment photo/.test(t))
    return [
      {
        text: "I can’t read payment details from this photo yet. Enter the biller and amount to continue. No payment has been made.",
      },
    ];

  if (/balance|how much.*(have|left)/.test(t))
    return [{ text: "Your wallet balance is currently unavailable." }];

  if (/beneficiar/.test(t))
    return [
      {
        text: "Beneficiaries are currently unavailable.",
      },
    ];

  if (/scheduled|reminder/.test(t))
    return [
      {
        text: "Scheduled payments are currently unavailable.",
      },
    ];

  if (/recent activity|transaction history|receipts/.test(t))
    return [
      {
        text: "Your activity and receipts are currently unavailable.",
      },
    ];

  if (/security|change pin/.test(t))
    return [
      {
        text: "Security settings are currently unavailable. Please contact customer support to make account-security changes.",
      },
    ];

  if (/airtime|recharge|data/.test(t)) {
    const service = /data/.test(t) ? "data" : "airtime";
    const amount = parseAmount(text.replace(phone ?? "", ""));
    const net = NETWORKS.find((n) => t.includes(n.toLowerCase()));
    if (!amount || !phone || !net)
      return [
        {
          text: `Tell me the amount, number and network, e.g. "₦1,000 ${service} to 08012345678 MTN".`,
        },
      ];
    return [
      {
        text: "Review your purchase details:",
        card: {
          kind: "approval",
          service,
          amount,
          account: phone,
          bank: net,
          status: "pending",
        },
      },
    ];
  }

  if (/electric|nepa|prepaid|meter|dstv|gotv|startimes|cable|bill/.test(t))
    return [
      {
        text: "Electricity and cable bill payments are currently unavailable. No payment has been made.",
      },
    ];

  if (/send|transfer|pay\b|sent/.test(t) || account) {
    const amount = parseAmount(text.replace(account ?? "", ""));
    const bank = BANKS.find((b) => t.includes(b.toLowerCase()));
    if (!amount || !account || !bank)
      return [
        {
          text: 'Who should I send to? Type it like "₦5,000 to 0123456789 GTBank". You can also use + to attach a photo, but I can’t read payment details from photos yet.',
        },
      ];
    return [
      {
        text: "Choose a reason for your transfer.",
        card: {
          kind: "narration",
          pending: {
            kind: "approval",
            service: "transfer",
            amount,
            account,
            bank,
            status: "pending",
          },
        },
      },
    ];
  }

  if (/^(hi|hello|hey|good (morning|afternoon|evening))/.test(t))
    return [
      {
        text: "Hi! I'm Nella. I can help with transfers, airtime, data, bills and balance questions. What would you like to do?",
      },
    ];

  if (/support|help|agent/.test(t))
    return [
      {
        text: "Support chat is currently unavailable.",
      },
    ];

  return [
    {
      text: 'I didn\'t quite get that. Try "check my balance", "send ₦5,000 to 0123456789 GTBank" or "₦1,000 airtime to 08012345678".',
    },
  ];
}
