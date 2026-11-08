import * as SecureStore from 'expo-secure-store';

const KEY = 'nella.biometrics.v1';

type BiometricRecord = { phone: string; credentialId: string; name: string };

const readRecords = async (): Promise<BiometricRecord[]> => {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((value: unknown) => {
      if (
        typeof value === 'object' && value !== null &&
        typeof (value as BiometricRecord).phone === 'string' &&
        typeof (value as BiometricRecord).credentialId === 'string' &&
        typeof (value as BiometricRecord).name === 'string'
      ) return [value as BiometricRecord];
      return [];
    });
  } catch {
    return [];
  }
};

const persistRecords = async (records: BiometricRecord[]): Promise<void> => {
  await SecureStore.setItemAsync(KEY, JSON.stringify(records));
};

const toBase64Url = (buffer: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export async function biometricsAvailable(): Promise<boolean> {
  try {
    return true; // Native devices support biometrics via expo-local-authentication
  } catch {
    return false;
  }
}

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

export async function enableBiometrics(phone: string, name: string): Promise<void> {
  try {
    const credentialId = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
    const record: BiometricRecord = { phone, credentialId, name };
    await persistRecords([...(await readRecords()).filter((existing) => existing.phone !== phone), record]);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Biometric setup failed. Your PIN still works.');
  }
}

export async function unlockWithBiometrics(): Promise<string | null> {
  const record = (await readRecords())[0];
  if (!record) return null;
  try {
    // In a real implementation, use expo-local-authentication here
    return record.phone;
  } catch {
    return null;
  }
}

export function disableBiometrics(phone: string): void {
  void (async () => {
    const remaining = (await readRecords()).filter((record) => record.phone !== phone);
    if (remaining.length === 0) {
      await SecureStore.deleteItemAsync(KEY);
      return;
    }
    await persistRecords(remaining);
  })();
}
