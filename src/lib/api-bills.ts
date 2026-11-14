/**
 * Bill payment API layer for the Nella mobile app.
 * Connects to the live backend's bills engine (src/lib/bills.ts).
 */

import { post, get, NellaApiError } from './api-client';
import { naira } from './demo-store';

export interface Biller {
  id: string;
  name: string;
  division: string;
  product: string;
  category: string;
  convenienceFee?: string;
}

export interface BillItem {
  id: string;
  name: string;
  code: string;
}

export interface BillValidation {
  valid: boolean;
  customerName?: string;
  accountName?: string;
  meterNumber?: string;
  smartcardNumber?: string;
  error?: string;
}

export interface BillQuote {
  service: string;
  amount: number;
  fee: number;
  vat: number;
  duty: number;
  total: number;
  narration?: string;
}

export interface BillResult {
  ok: true;
  reference: string;
  title: string;
  amount: number;
  token?: string;
  receipt?: {
    title: string;
    amount: number;
    rows: [string, string][];
  };
}

export interface BillError {
  ok: false;
  reason: string;
}

export type BillResponse = BillResult | BillError;

/** Fetch all available billers (electricity, cable TV, etc.) */
export async function fetchBillers(category?: string): Promise<Biller[]> {
  try {
    const path = category ? `/bills/list?category=${encodeURIComponent(category)}` : '/bills/list';
    return await get<Biller[]>(path, { auth: true });
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Failed to fetch billers', 'billers_failed');
  }
}

/** Fetch items/products for a biller (e.g., DStv packages, data plans) */
export async function fetchBillItems(billerId: string, divisionId: string, productId: string): Promise<BillItem[]> {
  try {
    return await get<BillItem[]>(
      `/bills/list?billerId=${encodeURIComponent(billerId)}&divisionId=${encodeURIComponent(divisionId)}&productId=${encodeURIComponent(productId)}`,
      { auth: true }
    );
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Failed to fetch bill items', 'items_failed');
  }
}

/** Validate a customer ID / meter number / smartcard number with VFD */
export async function validateBillCustomer(billerId: string, divisionId: string, paymentItem: string, customerId: string): Promise<BillValidation> {
  try {
    return await post<BillValidation>('/bills/list', {
      billerId,
      divisionId,
      paymentItem,
      customerId,
    }, { auth: true });
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Validation failed', 'validation_failed');
  }
}

/** Quote a bill purchase (calculate fees, VAT, stamp duty) */
export async function quoteBill(service: string, amount: number, customerId: string, provider: string, plan?: string): Promise<BillQuote> {
  try {
    return await post<BillQuote>('/bills/quote', {
      service,
      amount,
      customerId,
      provider,
      plan,
    }, { auth: true });
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Bill quote failed', 'quote_failed');
  }
}

/** Execute a bill purchase (PIN already checked on approval screen) */
export async function executeBillPurchase(reference: string, pin: string): Promise<BillResult> {
  try {
    const res = await post<BillResult>('/bills/execute', { reference, pin }, { auth: true });
    return res;
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Bill purchase failed', 'execution_failed');
  }
}

export { naira };
