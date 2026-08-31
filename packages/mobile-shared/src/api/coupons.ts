import { apiClient } from './client';

export interface CouponValidation {
  couponId: string;
  code: string;
  discountType: 'FLAT' | 'PERCENTAGE';
  discountValue: number;
  discountAmount: number;
  finalAmount: number;
}

export const couponsApi = {
  // Validate coupon and calculate discount
  async validateCoupon(data: {
    code: string;
    bookingAmount: number;
    routeId?: string;
  }): Promise<{ success: boolean; data: CouponValidation }> {
    const response = await apiClient.post('/coupons/validate', data);
    return response.data;
  },
};
