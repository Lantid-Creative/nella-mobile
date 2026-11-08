/**
 * Transaction history API layer for the Nella mobile app.
 * Connects to the live backend's transaction API (src/routes/api.v1.transactions.ts).
 */

import { get, NellaApiError } from './api-client';
import { naira } from './demo-store';

export interface Transaction {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'failed' | 'cancelled';
  reference?: string;
  description?: string;
  customer?: { name: string; phone: string | null };
  due_date: string | null;
  created_at: string;
  paid_at: string | null;
  paid_via: string | null;
  payment_reference: string | null;
  type: 'transfer' | 'airtime' | 'data' | 'electricity' | 'cable' | 'receipt' | 'balance';
}

export interface TransactionList {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

/** Fetch transaction history with optional filters */
export async function fetchTransactions(opts?: {
  page?: number;
  pageSize?: number;
  service?: 'all' | 'transfer' | 'airtime' | 'data' | 'electricity' | 'cable';
  search?: string;
}): Promise<TransactionList> {
  try {
    const params = new URLSearchParams();
    if (opts?.page) params.set('page', String(opts.page));
    if (opts?.pageSize) params.set('pageSize', String(opts.pageSize));
    if (opts?.service && opts.service !== 'all') params.set('service', opts.service);
    if (opts?.search) params.set('search', opts.search);

    const path = `/transactions?${params.toString()}`;
    return await get<TransactionList>(path, { auth: true });
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Failed to load transaction history', 'history_failed');
  }
}

/** Get a single transaction by ID */
export async function getTransaction(transactionId: string): Promise<Transaction> {
  try {
    return await get<Transaction>(`/transactions/${encodeURIComponent(transactionId)}`, { auth: true });
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Failed to load transaction', 'transaction_failed');
  }
}

export { naira };
