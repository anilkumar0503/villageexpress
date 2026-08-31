import { apiClient } from './client';

export type PayoutType = 'UPI' | 'BANK_TRANSFER';

export interface PayoutDetails {
  id: string;
  userId: string;
  type: PayoutType;
  upiId?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpiPayoutInput {
  type: 'UPI';
  upiId: string;
}

export interface BankPayoutInput {
  type: 'BANK_TRANSFER';
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
}

export type PayoutDetailsInput = UpiPayoutInput | BankPayoutInput;

export const payoutDetailsApi = {
  async getPayoutDetails(): Promise<{ success: boolean; data: PayoutDetails | null }> {
    const response = await apiClient.get('/payout-details');
    return response.data;
  },

  async savePayoutDetails(data: PayoutDetailsInput): Promise<{ success: boolean; data: PayoutDetails }> {
    const response = await apiClient.post('/payout-details', data);
    return response.data;
  },
};
