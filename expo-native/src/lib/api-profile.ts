/**
 * Profile & KYC API layer for the Nella mobile app.
 * Connects to the live backend's onboarding engine (src/lib/onboard.ts).
 */

import { get, post, NellaApiError } from './api-client';

export interface UserProfile {
  phone: string;
  full_name: string;
  tier: number;
  tierLabel: string;
  vfd_account_no: string | null;
  vfd_client_id: string | null;
  status: string;
  onboardingComplete: boolean;
  kycSetupComplete: boolean;
  kycStep?: number;
  address?: string;
  dob?: string;
  ninHash?: string;
  bvnHash?: string;
}

export interface OnboardingStatus {
  canEnterChat: boolean;
  stage: string;
  missing: string[];
}

export interface UpdateProfileRequest {
  full_name?: string;
  phone?: string;
}

/** Get the authenticated user's profile and KYC status */
export async function getProfile(): Promise<UserProfile> {
  try {
    return await get<UserProfile>('/profile', { auth: true });
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Failed to load profile', 'profile_failed');
  }
}

/** Get onboarding/KYC status */
export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  try {
    return await get<OnboardingStatus>('/profile/onboarding-status', { auth: true });
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Failed to load onboarding status', 'onboarding_failed');
  }
}

/** Update profile details */
export async function updateProfile(updates: UpdateProfileRequest): Promise<UserProfile> {
  try {
    return await post<UserProfile>('/profile', updates, { auth: true });
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Failed to update profile', 'update_failed');
  }
}

/** Request KYC verification (NIN/BVN/address) */
export async function requestKycVerification(details: {
  nin?: string;
  bvn?: string;
  dob?: string;
  address?: string;
}): Promise<void> {
  try {
    await post('/profile/kyc', details, { auth: true });
  } catch (err) {
    if (err instanceof NellaApiError) throw err;
    throw new NellaApiError('Kyc verification request failed', 'kyc_failed');
  }
}
