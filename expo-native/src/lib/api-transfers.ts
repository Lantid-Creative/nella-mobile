/**
 * Transfer API layer for the Nella mobile app.
 * Connects to the live backend's transfer engine (src/lib/transfers.ts).
 */

import { post, get, NellaApiError } from './api-client';
import { naira } from './demo-store';

export interface TransferQuote {
  service: 'transfer';
  amount: string;
  destination: string;
  provider: string;
  narration: string;
  plan: string;
}

export interface QuoteResult {
  ok: true;
  toName: string;
  amountMinor: number;
  feeMinor: number;
  vatMinor: number;
  dutyMinor: number;
  totalMinor: number;
  reference: string;
  referenceLabel: string;
  duplicateWarn: string | null;
  nellaFree: boolean;
}

export interface QuoteError {
  ok: false;
  reason: string;
  shortByMinor?: number;
  maxSendableMinor?: number;
}

export type QuoteResponse = QuoteResult | QuoteError;

export interface ExecuteResult {
  ok: boolean;
  message: string;
  reference?: string;
  receipt?: {
    title: string;
    amount: number;
    rows: [string, string][];
  };
}

/**
 * Request a payment quote from the backend.
 * Body: { service, amount, destination, provider, narration, plan }
 */
export async function quoteTransfer(draft: TransferQuote): Promise<QuoteResponse> {
  try {
    const res = await post<QuoteResponse>('/transfer/quote', draft, { auth: true });
    return res;
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Failed to quote transfer', 'quote_failed');
  }
}

/**
 * Execute a approved transfer (PIN already checked on the approval screen).
 * Body: { reference, pin }
 */
export async function executeTransfer(reference: string, pin: string): Promise<ExecuteResult> {
  try {
    const res = await post<ExecuteResult>('/transfer/execute', { reference, pin }, { auth: true });
    return res;
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Transfer execution failed', 'execution_failed');
  }
}

/**
 * Cancel a pending transfer quote.
 */
export async function cancelTransfer(reference: string): Promise<void> {
  try {
    await post('/transfer/cancel', { reference }, { auth: true });
  } catch {
    // ignore cancellation errors
  }
}

export { naira };
