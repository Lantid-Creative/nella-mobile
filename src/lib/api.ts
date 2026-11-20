// The Nella mobile API client (19 Nov 2026).
//
// One place that knows the base URL, the tokens, the device id and the shape
// of a refusal. Components never call fetch directly: the session is rotated
// here (a 401 gets one refresh, then the customer is signed out), and every
// money call goes through the v1 surface the server actually implements.

const DEFAULT_BASE = "https://usenella.com";

/** Store builds talk to production; dev builds can point at dev.usenella.com. */
export const API_BASE = (() => {
  const configured = (import.meta.env["VITE_API_BASE"] as string | undefined)?.trim();
  return (configured || DEFAULT_BASE).replace(/\/+$/, "");
})();

export interface PublicUser {
  phone: string;
  fullName: string | null;
  tier: number;
  status: string;
  accountNumber: string | null;
  bankName: string;
  onboardingComplete: boolean;
  kycStep: number;
}

export interface Bank {
  code: string;
  name: string;
}

export interface Transaction {
  id: string;
  reference: string;
  type: "credit" | "debit";
  amountMinor: number;
  currency: string;
  description: string;
  createdAt: string;
}

export interface Beneficiary {
  name: string;
  account: string;
  bank: string;
}

export type TransferQuote =
  | {
      ok: true;
      reference: string;
      toName: string;
      toAccount: string;
      toBank: string;
      amountMinor: number;
      feeMinor: number;
      totalMinor: number;
      nellaFree: boolean;
      duplicateWarn: string | null;
      expiresIn: number;
    }
  | {
      ok: false;
      reason: string;
      shortByMinor: number | null;
      maxSendableMinor: number | null;
    };

export type ExecuteResult = {
  ok: boolean;
  message: string;
  code?: string;
  retryable?: boolean;
};

export interface MobileBiller {
  id: string;
  name: string;
  division: string;
  product: string;
}

export interface MobileBillItem {
  code: string;
  name: string;
  amountMinor: number;
  fixed: boolean;
}

export type BillQuote =
  | {
      ok: true;
      reference: string;
      billerName: string;
      itemName: string;
      customerId: string;
      customerName?: string;
      customerAddress?: string;
      amountMinor: number;
      convenienceMinor: number;
      totalMinor: number;
      expiresIn: number;
    }
  | { ok: false; message: string };

export interface ReceiptPreview {
  title: string;
  amount: number;
  amountMinor: number;
  rows: [string, string][];
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Storage. The WebView's localStorage is per-app and not reachable by other
// apps; nothing here is a server secret — it is the customer's own session.

const SESSION_KEY = "nella.auth.v1";
const DEVICE_KEY = "nella.device.v1";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readJson<T>(key: string): T | null {
  try {
    const raw = storage()?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    if (value === null) storage()?.removeItem(key);
    else storage()?.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or disabled — the session stays in memory */
  }
}

/** A stable, opaque per-install id. The server binds refresh tokens to it. */
export function deviceId(): string {
  const existing = storage()?.getItem(DEVICE_KEY);
  if (existing && /^[\w.:-]{8,128}$/.test(existing)) return existing;
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  const id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  try {
    storage()?.setItem(DEVICE_KEY, id);
  } catch {
    /* unusable storage — the id is still good for this launch */
  }
  return id;
}

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: PublicUser;
}

let session: StoredSession | null = readJson<StoredSession>(SESSION_KEY);

export function currentSession(): StoredSession | null {
  return session;
}

export function currentUser(): PublicUser | null {
  return session?.user ?? null;
}

export function signedIn(): boolean {
  return !!session;
}

function saveSession(next: StoredSession): void {
  session = next;
  writeJson(SESSION_KEY, next);
}

export function clearSession(): void {
  session = null;
  writeJson(SESSION_KEY, null);
}

// ---------------------------------------------------------------------------
// Requests

interface ErrorEnvelope {
  error?: { code?: unknown; message?: unknown };
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        accept: "application/json",
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...(init.headers || {}),
      },
    });
  } catch {
    throw new ApiError(0, "offline", "You’re offline. Check your connection and try again.");
  }
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    const envelope = (body || {}) as ErrorEnvelope;
    const code =
      typeof envelope.error?.code === "string" ? envelope.error.code : `http_${res.status}`;
    const message =
      typeof envelope.error?.message === "string"
        ? envelope.error.message
        : "Something went wrong. Please try again.";
    throw new ApiError(res.status, code, message);
  }
  return body as T;
}

function bearer(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

async function refreshSession(): Promise<boolean> {
  if (!session?.refreshToken) return false;
  try {
    const rotated = await call<{
      ok: true;
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }>("/api/mobile/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: session.refreshToken, deviceId: deviceId() }),
    });
    saveSession({
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
      expiresAt: Date.now() + rotated.expiresIn * 1000,
      user: session.user,
    });
    return true;
  } catch {
    clearSession();
    return false;
  }
}

/** An authenticated call: one silent refresh on 401, then signed out. */
async function authed<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!session) throw new ApiError(401, "unauthorized", "Please sign in again.");
  try {
    return await call<T>(path, {
      ...init,
      headers: { ...bearer(session.accessToken), ...(init.headers || {}) },
    });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    if (!(await refreshSession())) {
      throw new ApiError(401, "unauthorized", "Your session expired. Please sign in again.");
    }
    return call<T>(path, {
      ...init,
      headers: { ...bearer(session!.accessToken), ...(init.headers || {}) },
    });
  }
}

// ---------------------------------------------------------------------------
// Auth

export interface SignInResult {
  user: PublicUser;
}

export async function signIn(phone: string, pin: string): Promise<SignInResult> {
  const res = await call<{
    ok: true;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: PublicUser;
  }>("/api/mobile/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ phone, pin, deviceId: deviceId() }),
  });
  saveSession({
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
    expiresAt: Date.now() + res.expiresIn * 1000,
    user: res.user,
  });
  return { user: res.user };
}

export async function signOut(): Promise<void> {
  const had = session;
  clearSession();
  if (!had) return;
  // Best effort: the local session is gone either way.
  try {
    await call("/api/mobile/v1/auth/logout", {
      method: "POST",
      headers: bearer(had.accessToken),
    });
  } catch {
    /* offline, or already expired */
  }
}

/** Re-read the account (name, tier, KYC) after sign-in or a KYC change. */
export async function me(): Promise<PublicUser> {
  const res = await authed<{ ok: true; user: PublicUser }>("/api/mobile/v1/me");
  if (session) saveSession({ ...session, user: res.user });
  return res.user;
}

// ---------------------------------------------------------------------------
// Money

export async function balance(): Promise<{
  balanceMinor: number;
  currency: string;
  accountNumber: string;
  bankName: string;
  asOf: string;
}> {
  return authed("/api/mobile/v1/balance");
}

export async function history(
  page = 1,
  pageSize = 50,
): Promise<{
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  return authed(`/api/mobile/v1/history?page=${page}&pageSize=${pageSize}`);
}

export async function beneficiaries(): Promise<Beneficiary[]> {
  const res = await authed<{ ok: true; beneficiaries: Beneficiary[] }>(
    "/api/mobile/v1/beneficiaries",
  );
  return res.beneficiaries;
}

export async function addBeneficiary(input: Beneficiary): Promise<void> {
  await authed("/api/mobile/v1/beneficiaries", { method: "POST", body: JSON.stringify(input) });
}

export async function removeBeneficiary(account: string, bank: string): Promise<void> {
  const query = `account=${encodeURIComponent(account)}&bank=${encodeURIComponent(bank)}`;
  await authed(`/api/mobile/v1/beneficiaries?${query}`, { method: "DELETE" });
}

export async function banks(query = ""): Promise<Bank[]> {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
  const res = await authed<{ ok: true; banks: Bank[] }>(`/api/mobile/v1/banks${suffix}`);
  return res.banks;
}

export async function nameEnquiry(
  account: string,
  bank: string,
): Promise<{ ok: true; name: string; account: string } | { ok: false; message: string }> {
  return authed("/api/mobile/v1/transfer/name-enquiry", {
    method: "POST",
    body: JSON.stringify({ account, bank }),
  });
}

export async function quoteTransfer(input: {
  amountMinor: number;
  toAccount: string;
  toBank: string;
  narration?: string;
}): Promise<TransferQuote> {
  return authed("/api/mobile/v1/transfer/quote", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function executeTransfer(pin: string, reference: string): Promise<ExecuteResult> {
  return authed("/api/mobile/v1/transfer/execute", {
    method: "POST",
    body: JSON.stringify({ pin, reference }),
  });
}

// ---------------------------------------------------------------------------
// Bills

export type BillCategory = "airtime" | "data" | "electricity" | "cable";

export async function billBillers(category: BillCategory): Promise<MobileBiller[]> {
  const res = await authed<{ ok: true; billers: MobileBiller[] }>(
    `/api/mobile/v1/bills/billers?category=${category}`,
  );
  return res.billers;
}

export async function billItems(billerId: string): Promise<{
  biller: MobileBiller;
  items: MobileBillItem[];
  openAmount: boolean;
}> {
  return authed(`/api/mobile/v1/bills/items?billerId=${encodeURIComponent(billerId)}`);
}

export async function validateBill(input: {
  billerId: string;
  paymentItem: string;
  customerId: string;
}): Promise<{ ok: boolean; name?: string; address?: string; units?: string; message?: string }> {
  return authed("/api/mobile/v1/bills/validate", { method: "POST", body: JSON.stringify(input) });
}

export async function quoteBill(input: {
  billerId: string;
  paymentItem?: string;
  itemName?: string;
  customerId: string;
  amountMinor?: number;
}): Promise<BillQuote> {
  return authed("/api/mobile/v1/bills/quote", { method: "POST", body: JSON.stringify(input) });
}

export async function executeBill(pin: string, reference: string): Promise<ExecuteResult> {
  return authed("/api/mobile/v1/bills/execute", {
    method: "POST",
    body: JSON.stringify({ pin, reference }),
  });
}

// ---------------------------------------------------------------------------
// Receipts

export async function receipt(reference: string): Promise<ReceiptPreview> {
  const res = await authed<{ ok: true; receipt: ReceiptPreview }>(
    `/api/mobile/v1/receipt?reference=${encodeURIComponent(reference)}`,
  );
  return res.receipt;
}

/** The PDF as a blob URL, for sharing or opening in the system viewer. */
export async function receiptPdfUrl(reference: string): Promise<string> {
  if (!session) throw new ApiError(401, "unauthorized", "Please sign in again.");
  const res = await fetch(
    `${API_BASE}/api/mobile/v1/receipt/pdf?reference=${encodeURIComponent(reference)}`,
    { headers: bearer(session.accessToken) },
  );
  if (!res.ok)
    throw new ApiError(res.status, "receipt_pdf_failed", "Could not download that receipt.");
  return URL.createObjectURL(await res.blob());
}
