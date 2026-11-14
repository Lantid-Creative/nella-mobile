/**
 * Balance API layer for the Nella mobile app.
 * Connects to the live backend's balance endpoint (src/routes/api.mobile.balance.tsx).
 */

import { get, NellaApiError } from './api-client';
import { naira } from './demo-store';

export interface Balance {
  available: number;
  ledger: number;
  currency: string;
  accountNo: string | null;
}

/** Fetch the authenticated user's wallet balance */
export async function fetchBalance(): Promise<Balance> {
  try {
    return await get<Balance>('/balance', { auth: true });
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Failed to load balance', 'balance_failed');
  }
}

export { naira };
