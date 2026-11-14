/**
 * Receipt & statement API layer for the Nella mobile app.
 * Connects to the live backend's document generation (src/lib/documents.ts).
 */

import { get, getAuthToken, NellaApiError } from './api-client';

export interface ReceiptPreview {
  title: string;
  amount: number;
  rows: [string, string][];
}

export interface ReceiptResult {
  ok: true;
  receipt: ReceiptPreview;
  pdfUrl: string;
  previewText: string;
}

export interface ReceiptError {
  ok: false;
  reason: string;
}

export type ReceiptResponse = ReceiptResult | ReceiptError;

/** Get a payment receipt by reference (PDF download URL + preview) */
export async function getReceipt(reference: string): Promise<ReceiptResult> {
  try {
    const res = await get<ReceiptResult>(`/receipt/${encodeURIComponent(reference)}`, { auth: true });
    if (res.ok) return res;
    throw new NellaApiError((res as unknown as ReceiptError).reason, 'receipt_failed');
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Failed to load receipt', 'receipt_failed');
  }
}

/** Download a receipt PDF as a blob */
export async function downloadReceiptPdf(reference: string): Promise<Blob> {
  try {
    const token = getAuthToken() || '';
    const res = await fetch(`https://usenella.com/api/mobile/receipt/${encodeURIComponent(reference)}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf',
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      throw new NellaApiError('Failed to download receipt PDF', 'download_failed');
    }
    return await res.blob();
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Failed to download receipt PDF', 'download_failed');
  }
}

/** Get a monthly statement PDF */
export async function downloadStatementPdf(period: string): Promise<Blob> {
  try {
    const token = getAuthToken() || '';
    const res = await fetch(`https://usenella.com/api/mobile/receipt/${encodeURIComponent(period)}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf',
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      throw new NellaApiError('Failed to download statement PDF', 'download_failed');
    }
    return await res.blob();
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Failed to download statement PDF', 'download_failed');
  }
}
