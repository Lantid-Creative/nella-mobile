// Demo-only secure storage on this device. No real bank, no real money.
// Hybrid mode: tries the live backend API first, falls back to local demo storage.

import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';
import {
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser as apiGetCurrentUser,
  verifyPin as apiVerifyPin,
  setAuthSession,
  clearAuthSession,
  isDemoMode,
} from './api-auth';

export type DemoUser = {
  name: string;
  phone: string;
  pin: string;
  onboardingComplete?: boolean;
  kycSetupComplete?: boolean;
  kycStep?: number;
};

export type ApprovalCard = {
  kind: 'approval';
  service: 'transfer' | 'airtime' | 'data';
  amount: number;
  account: string;
  bank: string;
  narration?: string | undefined;
  status: 'pending' | 'approved' | 'cancelled';
};

export type Card =
  | { kind: 'preview'; preview: ReceiptPreview }
  | { kind: 'balance'; amount: string }
  | { kind: 'narration'; pending: ApprovalCard; done?: boolean | undefined }
  | ApprovalCard
  | { kind: 'receipt'; title: string; amount: number; rows: [string, string][] };

export type ChatMedia = {
  kind: 'image' | 'audio';
  label: string;
  previewUrl?: string | undefined;
  durationSeconds?: number | undefined;
};

export type ChatMsg = {
  id: string;
  role: 'user' | 'nella';
  text?: string | undefined;
  card?: Card | undefined;
  media?: ChatMedia | undefined;
  replyTo?: { id: string; role: 'user' | 'nella'; text: string } | undefined;
  reactions?: string[] | undefined;
  at: number;
};

export type ReceiptPreview = {
  title: string;
  amount: number;
  rows: [string, string][];
};

const USERS = 'nella.users.v2';
const SESSION = 'nella.session.v2';
const chatKey = (phone: string) => `nella.chat.v2.${phone}`;

const userSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().regex(/^[789][01]\d{8}$/),
  pin: z.string().regex(/^\d{4}$/),
  onboardingComplete: z.boolean().default(false),
  kycSetupComplete: z.boolean().default(false),
  kycStep: z.number().int().min(0).max(2).default(0),
});

const messageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'nella']),
  text: z.string().optional(),
  at: z.number().finite(),
  card: z
    .union([
      z.object({
        kind: z.literal('approval'),
        service: z.enum(['transfer', 'airtime', 'data']),
        amount: z.number().finite().positive(),
        account: z.string(),
        bank: z.string(),
        narration: z.string().optional(),
        status: z.enum(['pending', 'approved', 'cancelled']),
      }),
      z.object({ kind: z.literal('preview'), preview: z.any() }),
      z.object({ kind: z.literal('balance'), amount: z.string() }),
      z.object({
        kind: z.literal('narration'),
        pending: z.any(),
        done: z.boolean().optional(),
      }),
      z.object({ kind: z.literal('receipt'), title: z.string(), amount: z.number(), rows: z.array(z.tuple([z.string(), z.string()])) }),
    ])
    .optional(),
  media: z
    .object({
      kind: z.enum(['image', 'audio']),
      label: z.string(),
      previewUrl: z.string().optional(),
      durationSeconds: z.number().finite().optional(),
    })
    .optional(),
  replyTo: z.object({ id: z.string(), role: z.enum(['user', 'nella']), text: z.string().max(200) }).optional(),
  reactions: z.array(z.string().max(8)).max(5).optional(),
});

const readUsers = async (): Promise<DemoUser[]> => {
  const raw = await SecureStore.getItemAsync(USERS);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((value: unknown) => {
      const result = userSchema.safeParse(value);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
};

const persistUsers = async (users: DemoUser[]): Promise<void> => {
  await SecureStore.setItemAsync(USERS, JSON.stringify(users));
};

const setSession = async (phone: string): Promise<void> => {
  await SecureStore.setItemAsync(SESSION, phone);
};

/** Normalise Nigerian numbers to 10 digits after +234 (e.g. 8012345678). */
export function normalisePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('234')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  return /^[789][01]\d{8}$/.test(d) ? d : null;
}

export async function signUp(name: string, phoneRaw: string, pin: string): Promise<void> {
  // Try live backend first
  try {
    await import('./api-auth').then(({ post }) => post('/auth/signup', { name, phone: phoneRaw, pin }, { auth: false }));
    // If signup succeeded, log in
    await signIn(phoneRaw, pin);
    return;
  } catch {
    // Fall back to local demo
  }

  const phone = normalisePhone(phoneRaw);
  if (!phone) throw new Error('Enter a valid Nigerian phone number.');
  if (!/^\d{4}$/.test(pin)) throw new Error('Your PIN must be 4 digits.');
  const users = await readUsers();
  if (users.some((u) => u.phone === phone))
    throw new Error('This number already has an account. Log in instead.');
  if (name.trim().split(/\s+/).length < 2) throw new Error('Enter your first and last name.');
  users.push({ name: name.trim(), phone, pin, onboardingComplete: false });
  await persistUsers(users);
  await setSession(phone);
}

export async function signIn(phoneRaw: string, pin: string): Promise<void> {
  // Try live backend first
  try {
    const { login } = await import('./api-auth');
    await login(phoneRaw, pin);
    return;
  } catch {
    // Fall back to local demo
  }

  const phone = normalisePhone(phoneRaw);
  if (phone === DEMO_PHONE && pin === DEMO_PIN) {
    const users = await readUsers();
    if (!users.some((u) => u.phone === phone)) {
      users.push({ name: 'Demo Customer', phone, pin, onboardingComplete: true, kycSetupComplete: true });
      await persistUsers(users);
    }
    await setSession(phone);
    return;
  }

  const users = await readUsers();
  const u = users.find((x) => x.phone === phone);
  if (!u || u.pin !== pin) throw new Error('Wrong phone number or PIN.');
  await setSession(u.phone);
}

export async function signInVerified(phoneRaw: string): Promise<void> {
  const phone = normalisePhone(phoneRaw);
  const u = phone ? (await readUsers()).find((x) => x.phone === phone) : undefined;
  if (!u) throw new Error('No demo account was found for this number on this device.');
  await setSession(u.phone);
}

export async function resetDemoPin(phoneRaw: string, pin: string): Promise<void> {
  const phone = normalisePhone(phoneRaw);
  if (!phone) throw new Error('Enter the phone number used for this demo account.');
  if (!/^\d{4}$/.test(pin)) throw new Error('Your new PIN must be 4 digits.');

  const users = await readUsers();
  const user = users.find((candidate) => candidate.phone === phone);
  if (!user) throw new Error('No demo account was found for this number on this device.');

  user.pin = pin;
  await persistUsers(users);
}

export async function signOut(): Promise<boolean> {
  try {
    const { logout } = await import('./api-auth');
    await logout();
  } catch {}
  try {
    await SecureStore.deleteItemAsync(SESSION);
  } catch {}
  return true;
}

export const DEMO_PHONE = '8012345678';
export const DEMO_PIN = '1234';

export async function seedDemoLogin(): Promise<void> {
  const users = await readUsers();
  let user = users.find((candidate) => candidate.phone === DEMO_PHONE);
  if (!user) {
    user = { name: 'Demo Customer', phone: DEMO_PHONE, pin: DEMO_PIN, onboardingComplete: true, kycSetupComplete: true };
    users.push(user);
  } else {
    user.onboardingComplete = true;
    user.kycSetupComplete = true;
  }
  await persistUsers(users);
  await setSession(DEMO_PHONE);
}

export async function currentUser(): Promise<DemoUser | null> {
  // Try live backend first
  try {
    const { getCurrentUser } = await import('./api-auth');
    const apiUser = await getCurrentUser();
    if (apiUser) {
      return {
        name: apiUser.full_name,
        phone: apiUser.phone,
        pin: '', // backend doesn't return PIN
        onboardingComplete: apiUser.onboardingComplete,
        kycSetupComplete: apiUser.kycSetupComplete,
        kycStep: apiUser.kycStep,
      };
    }
  } catch {}

  let p: string | null = null;
  try {
    p = await SecureStore.getItemAsync(SESSION);
  } catch {
    return null;
  }
  if (!p) return null;
  return (await readUsers()).find((u) => u.phone === p) ?? null;
}

export const checkPin = (u: DemoUser, pin: string) => u.pin === pin;

export async function saveKycStep(step: number): Promise<void> {
  if (!Number.isInteger(step) || step < 0 || step > 2) throw new Error('Invalid setup step.');
  const active = await currentUser();
  if (!active) throw new Error('Log in to continue setup.');
  const users = await readUsers();
  const user = users.find((candidate) => candidate.phone === active.phone);
  if (!user) throw new Error('Account not found.');
  user.kycStep = step;
  await persistUsers(users);
}

export async function completeDemoKyc(): Promise<void> {
  const active = await currentUser();
  if (!active) throw new Error('Log in to finish your KYC setup.');
  const users = await readUsers();
  const user = users.find((candidate) => candidate.phone === active.phone);
  if (!user) throw new Error('Your account could not be found.');
  user.kycSetupComplete = true;
  await persistUsers(users);
}

export async function completeOnboarding(): Promise<void> {
  const active = await currentUser();
  if (!active) throw new Error('Log in to finish your account setup.');
  const users = await readUsers();
  const user = users.find((candidate) => candidate.phone === active.phone);
  if (!user) throw new Error('Your account could not be found.');
  if (!user.kycSetupComplete) throw new Error('Complete KYC setup before entering chat.');
  user.onboardingComplete = true;
  await persistUsers(users);
}

export async function canEnterChat(user: DemoUser | null): Promise<boolean> {
  return user?.onboardingComplete === true && user.kycSetupComplete === true;
}

const LEGACY_CHAT_COPY: Record<string, string> = {
  "Bill photo · preview only": 'Payment photo',
  "Voice note · preview only": 'Voice note',
  "I've received this voice note in the preview, but I can't transcribe it here. No audio was uploaded and no payment was started.":
    "Voice messages can't be transcribed right now. Please type your request instead.",
  "I can't read payment details from photos in this preview. Please type the biller and amount instead. Nothing has been paid.":
    "I can't read payment details from this photo yet. Enter the biller and amount to continue. No payment has been made.",
  "Your real activity and receipts will appear here after the live account is connected. This preview does not have transaction history.":
    'Your activity and receipts are currently unavailable.',
  "Support chat isn't connected in this preview. In the live app, this is where you'll be able to reach the support team.":
    'Support chat is currently unavailable.',
};

export async function loadChat(phone: string): Promise<ChatMsg[]> {
  const raw = await SecureStore.getItemAsync(chatKey(phone));
  if (!raw) return [];
  let messages: unknown[];
  try {
    messages = JSON.parse(raw);
    if (!Array.isArray(messages)) return [];
  } catch {
    return [];
  }
  return messages
    .flatMap((value: unknown) => {
      const parsed = messageSchema.safeParse(value);
      return parsed.success ? [parsed.data] : [];
    })
    .map((message): ChatMsg => {
      if (!message.media) {
        if (message.text === undefined) return message;
        const migratedText = LEGACY_CHAT_COPY[message.text];
        return migratedText === undefined ? message : { ...message, text: migratedText };
      }
      const { previewUrl: _previewUrl, ...media } = message.media;
      media.label = message.media.kind === 'image' ? 'Image attachment' : 'Voice attachment';
      const migratedMessage: ChatMsg = { ...message, media };
      if (message.text !== undefined) {
        migratedMessage.text = LEGACY_CHAT_COPY[message.text] ?? message.text;
      }
      return migratedMessage;
    });
}

export async function saveChat(phone: string, msgs: ChatMsg[]): Promise<boolean> {
  try {
    const persistentMessages = msgs.map((message) => {
      if (!message.media) return message;
      const { previewUrl: _previewUrl, ...media } = message.media;
      media.label = message.media.kind === 'image' ? 'Image attachment' : 'Voice attachment';
      return { ...message, media };
    });
    await SecureStore.setItemAsync(chatKey(phone), JSON.stringify(persistentMessages));
    return true;
  } catch {
    return false;
  }
}

export const naira = (n: number) =>
  '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const BANKS = [
  'GTBank', 'Access', 'Zenith', 'UBA', 'First Bank', 'Opay', 'Moniepoint', 'Palmpay', 'Kuda', 'Wema', 'Fidelity', 'Sterling', 'Union', 'Stanbic', 'FCMB', 'VFD',
];
const NETWORKS = ['MTN', 'Airtel', 'Glo', '9mobile'];

function parseAmount(t: string): number | null {
  const m = t.replace(/,/g, '').match(/(?:₦|n|naira\s*)?(\d+(?:\.\d+)?)\s*(k)?\b/i);
  const numericAmount = m?.[1];
  if (!numericAmount) return null;
  const n = parseFloat(numericAmount) * (m[2] ? 1000 : 1);
  return n > 0 ? n : null;
}

export function demoReply(text: string): Omit<ChatMsg, 'id' | 'at' | 'role'>[] {
  const t = text.toLowerCase();
  const account = text.match(/\b\d{10}\b/)?.[0];
  const phone = text.match(/\b0[789][01]\d{8}\b/)?.[0];

  if (/voice note|voice message/.test(t))
    return [{ text: "Voice messages can't be transcribed right now. Please type your request instead." }];

  if (/snapped a bill|payment photo/.test(t))
    return [{ text: "I can't read payment details from this photo yet. Enter the biller and amount to continue. No payment has been made." }];

  if (/balance|how much.*(have|left)/.test(t)) return [{ text: 'Your wallet balance is currently unavailable.' }];

  if (/beneficiar/.test(t)) return [{ text: 'Beneficiaries are currently unavailable.' }];

  if (/scheduled|reminder/.test(t)) return [{ text: 'Scheduled payments are currently unavailable.' }];

  if (/recent activity|transaction history|receipts/.test(t)) return [{ text: 'Your activity and receipts are currently unavailable.' }];

  if (/security|change pin/.test(t)) return [{ text: 'Security settings are currently unavailable. Please contact customer support to make account-security changes.' }];

  if (/airtime|recharge|data/.test(t)) {
    const service = /data/.test(t) ? 'data' : 'airtime';
    const amount = parseAmount(text.replace(phone ?? '', ''));
    const net = NETWORKS.find((n) => t.includes(n.toLowerCase()));
    if (!amount || !phone || !net)
      return [{ text: `Tell me the amount, number and network, e.g. "₦1,000 ${service} to 08012345678 MTN".` }];
    return [
      {
        text: 'Review your purchase details:',
        card: { kind: 'approval', service, amount, account: phone, bank: net, status: 'pending' },
      },
    ];
  }

  if (/electric|nepa|prepaid|meter|dstv|gotv|startimes|cable|bill/.test(t))
    return [{ text: 'Electricity and cable bill payments are currently unavailable. No payment has been made.' }];

  if (/send|transfer|pay\b|sent/.test(t) || account) {
    const amount = parseAmount(text.replace(account ?? '', ''));
    const bank = BANKS.find((b) => t.includes(b.toLowerCase()));
    if (!amount || !account || !bank)
      return [{ text: 'Who should I send to? Type it like "₦5,000 to 0123456789 GTBank". You can also use + to attach a photo, but I can’t read payment details from photos yet.' }];
    return [
      {
        text: 'Choose a reason for your transfer.',
        card: { kind: 'narration', pending: { kind: 'approval', service: 'transfer', amount, account, bank, status: 'pending' } },
      },
    ];
  }

  if (/^(hi|hello|hey|good (morning|afternoon|evening))/.test(t))
    return [{ text: 'Hi! I\'m Nella. I can help with transfers, airtime, data, bills and balance questions. What would you like to do?' }];

  if (/support|help|agent/.test(t)) return [{ text: 'Support chat is currently unavailable.' }];

  return [{ text: 'I didn\'t quite get that. Try "check my balance", "send ₦5,000 to 0123456789 GTBank" or "₦1,000 airtime to 08012345678".' }];
}
