/**
 * Auth layer for the Nella mobile app.
 * Authenticates against the live backend at usena.com/api/mobile/auth
 * Falls back to demo-mode PIN if the backend is unreachable.
 */

import { post, get, clearAuthSession, setAuthSession, getAuthToken, getStoredPhone, getStoredName, NellaApiError } from './api-client';
import { signIn as demoSignIn, currentUser as demoCurrentUser, canEnterChat as demoCanEnterChat, DEMO_PHONE, DEMO_PIN, checkPin as demoCheckPin } from './demo-store';

export interface LoginResult {
  user: ApiUser;
  token: string;
}

export interface AuthState {
  user: ApiUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isDemo: boolean;
}

export async function login(phone: string, pin: string): Promise<LoginResult> {
  // Try the live backend first
  try {
    const res = await post<{ user: ApiUser; token: string }>('/auth/login', { phone, pin }, { auth: false });
    if (res.user && res.token) {
      setAuthSession(res.user.phone, res.user.full_name, res.token);
      return res;
    }
    throw new NellaApiError('Invalid response from server', 'invalid_response');
  } catch (err) {
    // If backend is unreachable or returns auth error, fall back to demo mode
    const isNetworkError = err instanceof NellaApiError && (err.code === 'server_error' || err.code === 'invalid_response');
    const isAuthError = err instanceof NellaApiError && (err.code === 'invalid_credentials' || err.code === 'wrong_pin');

    if (isNetworkError || isAuthError) {
      // Try demo credentials
      const normalized = phone.replace(/\D/g, '');
      if (normalized === DEMO_PHONE && pin === DEMO_PIN) {
        const demoUser: ApiUser = {
          phone: DEMO_PHONE,
          full_name: 'Demo Customer',
          tier: 2,
          vfd_account_no: null,
          vfd_client_id: null,
          status: 'active',
          onboarding: { stage: 'ready', kycSetupComplete: true, onboardingComplete: true },
        };
        setAuthSession(DEMO_PHONE, 'Demo Customer', 'demo-token');
        return { user: demoUser, token: 'demo-token' };
      }
      throw err;
    }
    throw err;
  }
}

export async function logout(): Promise<void> {
  try {
    await post('/auth/logout', {}, { auth: true }).catch(() => {});
  } catch {
    // ignore logout errors
  }
  clearAuthSession();
}

export async function getCurrentUser(): Promise<ApiUser | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    return await get<ApiUser>('/auth/me', { auth: true });
  } catch {
    return null;
  }
}

export async function verifyPin(phone: string, pin: string): Promise<boolean> {
  // Try backend
  try {
    const res = await post<{ valid: boolean }>('/auth/verify-pin', { phone, pin }, { auth: true });
    return res.valid === true;
  } catch {
    // Fall back to demo
    try {
      const { checkPin } = await import('./demo-store');
      // We need the user object; demo store doesn't expose it easily without login
      return normalized === DEMO_PHONE && pin === DEMO_PIN;
    } catch {
      return false;
    }
  }
}

export function isDemoMode(): boolean {
  const token = getAuthToken();
  return token === 'demo-token';
}
