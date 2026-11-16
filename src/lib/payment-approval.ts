import type { DemoUser } from "./demo-store";

/** Local preview check only. This must never authorize a provider transaction. */
export function demoApprovalError(pin: string, user: DemoUser): string | null {
  if (!/^\d{4}$/.test(pin)) return "Enter your 4-digit demo PIN.";
  if (pin !== user.pin) return "That demo PIN is incorrect. Please try again.";
  return null;
}
