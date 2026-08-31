import { apiClient } from './client';

export interface CodCollection {
  id: string;
  amount: number;
  bookingId: string;
  status: 'PENDING' | 'REMITTED';
  collectedAt?: string;
  booking?: {
    bookingNumber: string;
    customer: { name: string; phone: string };
  };
}

export interface CodRemittance {
  id: string;
  totalAmount: number;
  status: 'PENDING' | 'VERIFIED';
  createdAt: string;
  collections: CodCollection[];
}

export const codApi = {
  async getCollections(): Promise<{ success: boolean; data: CodCollection[] }> {
    const response = await apiClient.get('/cod/collections');
    return response.data;
  },

  async collectCod(segmentId: string, amount: number): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.post(`/bookings/segments/${segmentId}/collect-cod`, { amount });
    return response.data;
  },

  async getRemittances(): Promise<{ success: boolean; data: CodRemittance[] }> {
    const response = await apiClient.get('/cod/remittances');
    return response.data;
  },

  async createRemittance(collectionIds: string[]): Promise<{ success: boolean; data: CodRemittance }> {
    const response = await apiClient.post('/cod/remittances', { collectionIds });
    return response.data;
  },
};
