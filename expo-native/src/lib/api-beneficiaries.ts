/**
 * Beneficiary API layer for the Nella mobile app.
 * Connects to the live backend's fraud/guard engine (src/lib/guard.ts).
 */

import { post, get, del, NellaApiError } from './api-client';

export interface SavedBeneficiary {
  id: string;
  name: string;
  account: string;
  bank: string;
  phone?: string;
  tag?: string;
  createdAt: string;
}

export interface AddBeneficiaryRequest {
  name: string;
  account: string;
  bank: string;
  phone?: string;
  tag?: string;
}

/** List all saved beneficiaries for the authenticated user */
export async function listBeneficiaries(): Promise<SavedBeneficiary[]> {
  try {
    return await get<SavedBeneficiary[]>('/beneficiaries', { auth: true });
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Failed to load beneficiaries', 'beneficiaries_failed');
  }
}

/** Add a new beneficiary */
export async function addBeneficiary(draft: AddBeneficiaryRequest): Promise<SavedBeneficiary> {
  try {
    return await post<SavedBeneficiary>('/beneficiaries', draft, { auth: true });
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Failed to add beneficiary', 'add_failed');
  }
}

/** Delete a saved beneficiary */
export async function deleteBeneficiary(beneficiaryId: string): Promise<void> {
  try {
    await del(`/beneficiaries/${encodeURIComponent(beneficiaryId)}`, { auth: true });
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Failed to delete beneficiary', 'delete_failed');
  }
}

/** Rename/update a beneficiary's tag/name */
export async function updateBeneficiary(beneficiaryId: string, updates: { name?: string; tag?: string }): Promise<SavedBeneficiary> {
  try {
    return await post<SavedBeneficiary>(`/beneficiaries/${encodeURIComponent(beneficiaryId)}`, updates, { auth: true });
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Failed to update beneficiary', 'update_failed');
  }
}

/** Check if an account number is already saved as a beneficiary */
export async function isBeneficiary(account: string, bank: string): Promise<boolean> {
  try {
    const res = await get<{ saved: boolean }>(
      `/beneficiaries/check?account=${encodeURIComponent(account)}&bank=${encodeURIComponent(bank)}`,
      { auth: true }
    );
    return res.saved === true;
  } catch {
    return false;
  }
}
