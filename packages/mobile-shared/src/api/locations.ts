import { apiClient } from './client';

export interface Location {
  id: string;
  pointName: string;
  village: string;
  mandal: string;
  district: string;
  state: string;
  pincode: string;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
}

export interface LocationsResponse {
  success: boolean;
  data: Location[];
}

export const locationsApi = {
  async getLocations(): Promise<LocationsResponse> {
    const response = await apiClient.get<LocationsResponse>('/locations');
    return response.data;
  },

  async getCascadingLocations(params?: {
    state?: string;
    district?: string;
    mandal?: string;
  }): Promise<LocationsResponse> {
    const response = await apiClient.get<LocationsResponse>('/locations/cascading', { params });
    return response.data;
  },
};
