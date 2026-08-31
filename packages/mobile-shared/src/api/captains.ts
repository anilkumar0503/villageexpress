import { apiClient } from './client';

export interface AvailableCaptain {
  id: string;
  displayId: string;
  name: string;
  phone: string;
  vehicleType?: string;
  isAvailable: boolean;
}

export const captainsApi = {
  async getAvailableCaptains(pointId?: string): Promise<{ success: boolean; data: AvailableCaptain[] }> {
    const response = await apiClient.get('/captains/available', { params: { pointId } });
    return response.data;
  },
};
