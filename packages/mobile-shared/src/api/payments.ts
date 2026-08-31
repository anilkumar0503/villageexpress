import { apiClient } from './client';

export interface PaymentOrder {
  id: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  status: string;
}

export const paymentsApi = {
  // Create Razorpay order for wallet top-up
  async createWalletTopupOrder(amount: number): Promise<{ success: boolean; data: PaymentOrder }> {
    const response = await apiClient.post('/payments/create-order', { amount, purpose: 'WALLET_TOPUP' });
    return response.data;
  },

  // Verify payment after Razorpay callback
  async verifyPayment(data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<{ success: boolean; data: { verified: boolean; walletBalance?: number } }> {
    const response = await apiClient.post('/payments/verify', data);
    return response.data;
  },

  // Get payment history
  async getPaymentHistory(): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get('/payments/history');
    return response.data;
  },
};
