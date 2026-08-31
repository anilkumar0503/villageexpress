import { apiClient } from './client';
import { z } from 'zod';

// Zod schemas
export const createBookingSchema = z.object({
  pickupLocationId: z.string().uuid('Invalid pickup location'),
  dropLocationId: z.string().uuid('Invalid drop location'),
  parcelWeight: z.number().positive('Weight must be positive'),
  parcelType: z.enum(['DOCUMENTS', 'GENERAL', 'FRAGILE', 'PERISHABLE']),
  deliveryPriority: z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT']).default('STANDARD'),
  vehicleType: z.enum(['BIKE', 'AUTO', 'MINI_VAN', 'VAN']).optional(),
  paymentMethod: z.enum(['UPI', 'CARD', 'NETBANKING', 'COD', 'ONLINE', 'WALLET']),
  routeId: z.string().uuid().optional(),
  couponId: z.string().uuid().optional(),
  finalPrice: z.number().positive().optional(),
});

export const pricePreviewSchema = z.object({
  pickupLocationId: z.string().uuid(),
  dropLocationId: z.string().uuid(),
  parcelWeight: z.number().positive(),
  parcelType: z.enum(['DOCUMENTS', 'GENERAL', 'FRAGILE', 'PERISHABLE']),
  deliveryPriority: z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT']),
  vehicleType: z.enum(['BIKE', 'AUTO', 'MINI_VAN', 'VAN']).optional(),
});

// TypeScript types
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type PricePreviewInput = z.infer<typeof pricePreviewSchema>;

export interface Booking {
  id: string;
  bookingNumber: string;
  status: 'PENDING' | 'PAYMENT_FAILED' | 'CONFIRMED' | 'RECEIVED_AT_POINT' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURN_INITIATED' | 'RETURNED';
  parcelWeight: number;
  parcelType: 'DOCUMENTS' | 'GENERAL' | 'FRAGILE' | 'PERISHABLE';
  deliveryPriority: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT';
  calculatedPrice: number;
  estimatedDeliveryDate: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  customer: {
    id: string;
    displayId: string;
    name: string;
    phone: string;
  };
  pickupLocation: {
    id: string;
    pointName: string;
    village: string;
    district: string;
  };
  dropLocation: {
    id: string;
    pointName: string;
    village: string;
    district: string;
  };
  pointManager?: {
    id: string;
    displayId: string;
    name: string;
    phone: string;
  };
  captain?: {
    id: string;
    displayId: string;
    name: string;
    phone: string;
  };
}

export interface PricePreview {
  success: boolean;
  data: {
    basePrice: number;
    distanceCharge: number;
    weightCharge: number;
    prioritySurcharge: number;
    totalAmount: number;
    estimatedDeliveryDays: number;
  };
}

export interface BookingsResponse {
  success: boolean;
  data: {
    items: Booking[];
    total: number;
    page: number;
    pageSize: number;
  };
}

// API functions
export const bookingsApi = {
  async getBookings(params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<BookingsResponse> {
    const response = await apiClient.get<BookingsResponse>('/bookings', { params });
    return response.data;
  },

  async getMyBookings(params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<BookingsResponse> {
    const response = await apiClient.get<BookingsResponse>('/bookings/my', { params });
    return response.data;
  },

  async getCaptainBookings(params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<BookingsResponse> {
    const response = await apiClient.get<BookingsResponse>('/bookings/captain', { params });
    return response.data;
  },

  async getPointManagerBookings(params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<BookingsResponse> {
    const response = await apiClient.get<BookingsResponse>('/bookings/point-manager', { params });
    return response.data;
  },

  async getBookingById(id: string): Promise<{ success: boolean; data: Booking }> {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data;
  },

  async createBooking(input: CreateBookingInput): Promise<{ success: boolean; data: Booking }> {
    const response = await apiClient.post('/bookings', input);
    return response.data;
  },

  async updateBookingStatus(id: string, status: string, notes?: string): Promise<{ success: boolean; data: Booking }> {
    const response = await apiClient.post(`/bookings/${id}/status`, { status, notes });
    return response.data;
  },

  async cancelBooking(id: string, reason?: string): Promise<{ success: boolean; data: Booking }> {
    const response = await apiClient.post(`/bookings/${id}/cancel`, { reason });
    return response.data;
  },

  async assignCaptain(bookingId: string, captainId: string): Promise<{ success: boolean; data: Booking }> {
    const response = await apiClient.post(`/bookings/${bookingId}/assign-captain`, { captainId });
    return response.data;
  },

  async getPricePreview(input: PricePreviewInput): Promise<PricePreview> {
    const response = await apiClient.post<PricePreview>('/bookings/price-preview', input);
    return response.data;
  },

  async processPayment(bookingId: string, paymentMethod: string): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.post(`/bookings/${bookingId}/process-payment`, { paymentMethod });
    return response.data;
  },

  async walletPayment(bookingId: string): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.post(`/bookings/${bookingId}/wallet-payment`);
    return response.data;
  },

  async uploadValidationImage(bookingId: string, imageUri: string): Promise<{ success: boolean; data: any }> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'validation.jpg',
    } as any);

    const response = await apiClient.post(`/bookings/${bookingId}/upload-validation-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async validateDeliveryOtp(bookingId: string, otp: string): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.post(`/bookings/${bookingId}/validate-delivery-otp`, { otp });
    return response.data;
  },
};