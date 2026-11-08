import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

export function formatPhone(raw: string) {
  let value = raw.replace(/\D/g, '').slice(0, 14);
  if (value.startsWith('234')) value = value.slice(3);
  value = value.slice(0, value.startsWith('0') ? 11 : 10);
  const first = value.startsWith('0') ? 4 : 3;
  return [value.slice(0, first), value.slice(first, first + 3), value.slice(first + 3)].filter(Boolean).join(' ');
}

export const loginPinReady = (phone: string, pin: string) =>
  /^(?:234|0)?[789][01]\d{8}$/.test(phone.replace(/\D/g, '')) && /^\d{4}$/.test(pin);

const setupSchema = z.object({ name: z.string().max(120), phone: z.string().max(20), step: z.number().int().min(0).max(2) });
const key = 'nella.setup-draft.v1';

export async function readSetupDraft() {
  try {
    const raw = await SecureStore.getItemAsync(key);
    if (!raw) return null;
    const parsed = setupSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function saveSetupDraft(draft: z.infer<typeof setupSchema>) {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(setupSchema.parse(draft)));
    return true;
  } catch {
    return false;
  }
}

export async function clearSetupDraft() {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}
