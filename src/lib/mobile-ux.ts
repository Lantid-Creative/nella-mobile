import { z } from "zod";
import { readDemoValue, writeDemoValue, removeDemoValue } from "./demo-storage";

export function formatPhone(raw: string) {
  let value = raw.replace(/\D/g, "").slice(0, 14);
  if (value.startsWith("234")) value = value.slice(3);
  value = value.slice(0, value.startsWith("0") ? 11 : 10);
  const first = value.startsWith("0") ? 4 : 3;
  return [value.slice(0, first), value.slice(first, first + 3), value.slice(first + 3)]
    .filter(Boolean)
    .join(" ");
}
export const loginPinReady = (phone: string, pin: string) =>
  /^(?:234|0)?[789][01]\d{8}$/.test(phone.replace(/\D/g, "")) && /^\d{4}$/.test(pin);
const setupSchema = z.object({
  name: z.string().max(120),
  phone: z.string().max(20),
  step: z.number().int().min(0).max(2),
});
const key = "nella.setup-draft.v1";
export function readSetupDraft() {
  const parsed = setupSchema.safeParse(readDemoValue(key));
  return parsed.success ? parsed.data : null;
}
export const saveSetupDraft = (draft: z.infer<typeof setupSchema>) =>
  writeDemoValue(key, setupSchema.parse(draft));
export const clearSetupDraft = () => removeDemoValue(key);
