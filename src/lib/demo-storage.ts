// Browser-preview storage only; never an authentication authority for live services.
export const STORAGE_NOTICE = "Your browser couldn’t save this change. Keep this page open; changes may be lost when you leave.";

export function storageWarning() {
  window.dispatchEvent(new CustomEvent("nella-storage-warning", { detail: STORAGE_NOTICE }));
}

export function readDemoValue(key: string): unknown {
  try {
    const value = localStorage.getItem(key);
    return value === null ? undefined : JSON.parse(value);
  } catch {
    storageWarning();
    return undefined;
  }
}

export function writeDemoValue(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    storageWarning();
    return false;
  }
}

export function removeDemoValue(key: string): boolean {
  try { localStorage.removeItem(key); return true; }
  catch { storageWarning(); return false; }
}