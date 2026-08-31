import { apiClient } from './client';

export interface WalletTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'ADMIN_ADJUSTMENT';
  amount: number;
  description: string;
  createdAt: string;
  bookingId?: string;
  referenceId?: string;
  referenceType?: string;
}

export interface WalletData {
  balance: number;
  transactions: WalletTransaction[];
}

export const walletApi = {
  async getWallet(): Promise<{ success: boolean; data: WalletData }> {
    const response = await apiClient.get('/wallet');
    return response.data;
  },

  async getWalletBalance(): Promise<{ success: boolean; data: { balance: number } }> {
    const response = await apiClient.get('/wallet/balance');
    return response.data;
  },

  // Create Razorpay order for wallet recharge
  async createRechargeOrder(amount: number): Promise<{
    success: boolean;
    data: { orderId: string; amount: number; currency: string; keyId: string };
  }> {
    const response = await apiClient.post('/wallet/recharge', { amount });
    return response.data;
  },

  // Verify Razorpay payment and credit wallet
  async verifyRecharge(data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<{ success: boolean; data: { walletBalance: number } }> {
    const response = await apiClient.post('/wallet/recharge/verify', data);
    return response.data;
  },
};
