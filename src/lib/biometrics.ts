// Biometric unlock for the browser preview, built on WebAuthn platform
// authenticators. The device picks its own method — fingerprint, face, iris or
// pattern. This only unlocks the demo app on this device — it never
// authorizes payments and never replaces the payment PIN.
import { readDemoValue, writeDemoValue, removeDemoValue, STORAGE_NOTICE } from "./demo-storage";

const KEY = "nella.biometrics.v1";

type BiometricRecord = { phone: string; credentialId: string; name: string };

const readRecords = (): BiometricRecord[] => {
  const raw = readDemoValue(KEY);
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((value): BiometricRecord[] => {
    if (
      typeof value === "object" &&
      value !== null &&
      typeof (value as BiometricRecord).phone === "string" &&
      typeof (value as BiometricRecord).credentialId === "string" &&
      typeof (value as BiometricRecord).name === "string"
    )
      return [value as BiometricRecord];
    return [];
  });
};

const persistRecords = (records: BiometricRecord[]) => {
  if (!writeDemoValue(KEY, records)) throw new Error(STORAGE_NOTICE);
};

const toBase64Url = (buffer: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const randomChallenge = () => crypto.getRandomValues(new Uint8Array(32));

/** True when this device can verify the user with a biometric or device unlock method. */
export async function biometricsAvailable(): Promise<boolean> {
  try {
    if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** The phone number that has biometric/device unlock set up on this device, if any. */
export function biometricPhone(): string | null {
  return readRecords()[0]?.phone ?? null;
}

export function hasBiometrics(phone: string): boolean {
  return readRecords().some((record) => record.phone === phone);
}

/**
 * Registers this device's biometric unlock for the given demo account.
 * Throws a friendly error when the device can't or the user cancels.
 */
export async function enableBiometrics(phone: string, name: string): Promise<void> {
  if (!(await biometricsAvailable()))
    throw new Error("This device doesn't offer biometric unlock here. Your PIN still works.");
  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: randomChallenge(),
        rp: { name: "Nella" },
        user: { id: new TextEncoder().encode(phone), name: `+234${phone}`, displayName: name },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null;
    if (!credential) throw new Error("Setup was cancelled.");
    const record: BiometricRecord = { phone, credentialId: toBase64Url(credential.rawId), name };
    persistRecords([...readRecords().filter((existing) => existing.phone !== phone), record]);
  } catch (error) {
    if (error instanceof Error && error.name === "NotAllowedError")
      throw new Error("Setup was cancelled or timed out. Your PIN still works.");
    throw error instanceof Error
      ? error
      : new Error("Biometric setup failed. Your PIN still works.");
  }
}

/**
 * Verifies the device owner with its biometric unlock and returns the phone number
 * of the matching demo account, or null when verification fails.
 */
export async function unlockWithBiometrics(): Promise<string | null> {
  const record = readRecords()[0];
  if (!record || !(await biometricsAvailable())) return null;
  try {
    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge: randomChallenge(),
        allowCredentials: [{ type: "public-key", id: fromBase64Url(record.credentialId) }],
        userVerification: "required",
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null;
    return assertion ? record.phone : null;
  } catch {
    return null;
  }
}

export function disableBiometrics(phone: string): void {
  const remaining = readRecords().filter((record) => record.phone !== phone);
  if (remaining.length === 0) {
    if (!removeDemoValue(KEY)) throw new Error(STORAGE_NOTICE);
    return;
  }
  persistRecords(remaining);
}
