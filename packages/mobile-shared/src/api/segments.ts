import { apiClient } from './client';

export interface BookingSegment {
  id: string;
  status: string;
  sequenceOrder: number;
  codCollectedAt?: string;
  booking: {
    id: string;
    bookingNumber: string;
    status: string;
    parcelWeight: number;
    parcelType: string;
    paymentMethod: string;
    calculatedPrice: number;
    customer: { id: string; name: string; phone: string };
  };
  routeSegment: {
    fromLocation: { id: string; pointName: string; village: string };
    toLocation: { id: string; pointName: string; village: string };
  };
  pointManager: { id: string; name: string; phone: string } | null;
}

export const segmentsApi = {
  // Captain: get assigned booking segments
  async getMySegments(params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ success: boolean; data: { items: BookingSegment[]; total: number; page: number } }> {
    const response = await apiClient.get('/bookings/segments/my', { params });
    return response.data;
  },

  // Update segment status (uses same booking status endpoint)
  async updateSegmentStatus(
    bookingId: string,
    status: string,
  ): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.put(`/bookings/${bookingId}/status`, { status });
    return response.data;
  },

  // Collect COD for a segment
  async collectCod(segmentId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/bookings/segments/${segmentId}/collect-cod`, {});
    return response.data;
  },
};
