import { apiClient } from './client';

export interface Commission {
  id: string;
  amount: number;
  bookingId: string;
  status: 'PENDING' | 'PAID';
  createdAt: string;
  booking?: {
    bookingNumber: string;
    calculatedPrice: number;
  };
}

export const commissionsApi = {
  async getMyCommissions(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<{ success: boolean; data: { items: Commission[]; total: number } }> {
    const response = await apiClient.get('/commissions/my', { params });
    return response.data;
  },

  async requestPayout(amount: number): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.post('/commissions/payout', { amount });
    return response.data;
  },
};
