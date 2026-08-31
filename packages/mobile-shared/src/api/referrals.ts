import { apiClient } from './client';

export interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  bonusAmount: number;
  status: string;
  createdAt: string;
}

export const referralsApi = {
  // Apply a referral code (the referrer's displayId)
  async applyReferral(referralCode: string): Promise<{ success: boolean; data: Referral }> {
    const response = await apiClient.post('/referrals/apply', { referralCode });
    return response.data;
  },
};
