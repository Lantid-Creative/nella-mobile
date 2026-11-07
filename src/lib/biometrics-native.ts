// Biometric unlock for the native app, built on Expo LocalAuthentication.
// The device picks its own method — fingerprint, face, iris or pattern.
// This only unlocks the demo app on this device — it never authorizes
// payments and never replaces the payment PIN.

import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const KEY = "nella.biometrics.v1";

type BiometricRecord = { phone: string; credentialId: string; name: string };

const readRecords = async (): Promise<BiometricRecord[]> => {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((value: unknown) => {
      if (
        typeof value === "object" && value !== null &&
        typeof (value as BiometricRecord).phone === "string" &&
        typeof (value as BiometricRecord).credentialId === "string" &&
        typeof (value as BiometricRecord).name === "string"
      )
        return [value as BiometricRecord];
      return [];
    });
  } catch {
    return [];
  }
};

const persistRecords = async (records: BiometricRecord[]): Promise<void> => {
  await SecureStore.setItemAsync(KEY, JSON.stringify(records));
};

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

/** True when this device can verify the user with a biometric or device unlock method. */
export async function biometricsAvailable(): Promise<boolean> {
  try {
    return await LocalAuthentication.hasHardwareAsync() && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

/** The phone number that has biometric/device unlock set up on this device, if any. */
export async function biometricPhone(): Promise<string | null> {
  try {
    const records = await readRecords();
    return records[0]?.phone ?? null;
  } catch {
    return null;
  }
}

export async function hasBiometrics(phone: string): Promise<boolean> {
  const records = await readRecords();
  return records.some((record) => record.phone === phone);
}

/** Registers this device's biometric unlock for the given demo account. */
export async function enableBiometrics(phone: string, name: string): Promise<void> {
  if (!(await biometricsAvailable()))
    throw new Error("This device doesn't offer biometric unlock here. Your PIN still works.");
  try {
    // On native, we store a marker record after the user enrolls via the
    // platform's own biometric settings. We simulate a credential id.
    const credentialId = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
    const record: BiometricRecord = { phone, credentialId, name };
    await persistRecords([...(await readRecords()).filter((existing) => existing.phone !== phone), record]);
  } catch (error) {
    throw error instanceof Error ? error : new Error("Biometric setup failed. Your PIN still works.");
  }
}

/** Verifies the device owner with its biometric unlock and returns the phone number
 *  of the matching demo account, or null when verification fails. */
export async function unlockWithBiometrics(): Promise<string | null> {
  const record = (await readRecords())[0];
  if (!record || !(await biometricsAvailable())) return null;
  try {
    const result = await (LocalAuthentication as any).authenticateAsync({
      promptMessage: "Unlock Nella",
      cancelLabel: "Cancel",
    });
    if (result.success) return record.phone;
    return null;
  } catch {
    return null;
  }
}

export function disableBiometrics(phone: string): void {
  // Fire-and-forget; secure-store is async so we don't await here.
  void (async () => {
    const remaining = (await readRecords()).filter((record) => record.phone !== phone);
    if (remaining.length === 0) {
      await SecureStore.deleteItemAsync(KEY);
      return;
    }
    await persistRecords(remaining);
  })();
}
