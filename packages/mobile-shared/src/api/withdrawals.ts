import { apiClient } from './client';

export interface Withdrawal {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  createdAt: string;
  note?: string;
  bankAccount?: string;
}

export const withdrawalsApi = {
  async getWithdrawals(): Promise<{ success: boolean; data: Withdrawal[] }> {
    const response = await apiClient.get('/withdrawals');
    return response.data;
  },

  async requestWithdrawal(input: {
    amount: number;
    bankAccount?: string;
    ifscCode?: string;
    accountHolder?: string;
  }): Promise<{ success: boolean; data: Withdrawal }> {
    const response = await apiClient.post('/withdrawals', input);
    return response.data;
  },
};
