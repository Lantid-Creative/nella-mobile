/**
 * Nella Mobile API Client
 * Connects the Expo app to the live Nella backend at usenella.com
 *
 * Base URL: https://usenella.com/api/mobile
 * Auth: Bearer JWT token (phone + PIN login)
 */

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'https://usenella.com/api/mobile';
const TOKEN_KEY = 'nella.auth.token';
const PHONE_KEY = 'nella.auth.phone';
const NAME_KEY = 'nella.auth.name';

import * as SecureStore from 'expo-secure-store';

export interface ApiUser {
  phone: string;
  full_name: string;
  tier: number;
  vfd_account_no: string | null;
  vfd_client_id: string | null;
  status: string;
  onboarding?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
}

export class NellaApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'NellaApiError';
  }
}

let authToken: string | null = null;
let authPhone: string | null = null;
let authName: string | null = null;
let hydrated = false;

async function readKey(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function writeKey(key: string, value: string | null): Promise<void> {
  try {
    if (value === null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch {}
}

/** Load the persisted session from the device keychain. Call once at startup. */
export async function hydrateAuthSession(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  const [token, phone, name] = await Promise.all([
    readKey(TOKEN_KEY),
    readKey(PHONE_KEY),
    readKey(NAME_KEY),
  ]);
  authToken = token;
  authPhone = phone;
  authName = name;
}

export function setAuthToken(token: string | null) {
  authToken = token;
  void writeKey(TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  return authToken;
}

export function setAuthSession(phone: string, name: string, token: string) {
  authToken = token;
  authPhone = phone;
  authName = name;
  void Promise.all([
    writeKey(TOKEN_KEY, token),
    writeKey(PHONE_KEY, phone),
    writeKey(NAME_KEY, name),
  ]);
}

export function clearAuthSession() {
  authToken = null;
  authPhone = null;
  authName = null;
  void Promise.all([
    writeKey(TOKEN_KEY, null),
    writeKey(PHONE_KEY, null),
    writeKey(NAME_KEY, null),
  ]);
}

export function getStoredPhone(): string | null {
  return authPhone;
}

export function getStoredName(): string | null {
  return authName;
}

async function request<T>(
  path: string,
  opts: { method?: string; body?: unknown; headers?: Record<string, string>; auth?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, headers, auth = true } = opts;
  const token = auth ? getAuthToken() : null;

  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  if (token) h['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: h,
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    let errorCode = 'server_error';
    try {
      const body = await res.json();
      errorMsg = body.message || errorMsg;
      errorCode = body.code || errorCode;
    } catch {}
    throw new NellaApiError(errorMsg, errorCode);
  }

  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

/** POST with JSON body */
export function post<T>(path: string, body: unknown, opts?: { headers?: Record<string, string>; auth?: boolean }) {
  return request<T>(path, { method: 'POST', body, ...opts });
}

/** GET */
export function get<T>(path: string, opts?: { headers?: Record<string, string>; auth?: boolean }) {
  return request<T>(path, { method: 'GET', ...opts });
}

/** PUT */
export function put<T>(path: string, body: unknown, opts?: { headers?: Record<string, string>; auth?: boolean }) {
  return request<T>(path, { method: 'PUT', body, ...opts });
}

/** DELETE */
export function del<T>(path: string, opts?: { headers?: Record<string, string>; auth?: boolean }) {
  return request<T>(path, { method: 'DELETE', ...opts });
}

export { API_BASE };
