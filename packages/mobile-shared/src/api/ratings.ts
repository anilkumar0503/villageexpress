import { apiClient } from './client';

export interface Rating {
  id: string;
  rating: number;
  comment?: string;
  bookingId: string;
  raterId: string;
  ratedId: string;
  createdAt: string;
}

export const ratingsApi = {
  async submitRating(data: {
    bookingId: string;
    rating: number;
    comment?: string;
  }): Promise<{ success: boolean; data: Rating }> {
    const response = await apiClient.post('/ratings', data);
    return response.data;
  },

  async getCaptainRatings(captainId: string): Promise<{
    success: boolean;
    data: { ratings: Rating[]; averageRating: number; totalRatings: number };
  }> {
    const response = await apiClient.get(`/ratings?captainId=${captainId}`);
    return response.data;
  },
};
