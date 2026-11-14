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

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch {}
  } else {
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthSession(phone: string, name: string, token: string) {
  authToken = token;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(PHONE_KEY, phone);
    localStorage.setItem(NAME_KEY, name);
  } catch {}
}

export function clearAuthSession() {
  authToken = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PHONE_KEY);
    localStorage.removeItem(NAME_KEY);
  } catch {}
}

export function getStoredPhone(): string | null {
  try { return localStorage.getItem(PHONE_KEY); } catch { return null; }
}

export function getStoredName(): string | null {
  try { return localStorage.getItem(NAME_KEY); } catch { return null; }
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
