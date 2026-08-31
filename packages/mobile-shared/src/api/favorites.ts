import { apiClient } from './client';

export interface FavoriteLocation {
  id: string;
  locationId: string;
  label: string;
  locationType: 'PICKUP' | 'DROP' | 'BOTH';
  createdAt: string;
  location: {
    id: string;
    pointName: string;
    village: string;
    district: string;
    state: string;
    pincode: string;
  };
}

export const favoritesApi = {
  async getFavorites(): Promise<{ success: boolean; data: FavoriteLocation[] }> {
    const response = await apiClient.get('/favorite-locations');
    return response.data;
  },

  async addFavorite(data: {
    locationId: string;
    label: string;
    locationType?: 'PICKUP' | 'DROP' | 'BOTH';
  }): Promise<{ success: boolean; data: FavoriteLocation }> {
    const response = await apiClient.post('/favorite-locations', {
      ...data,
      locationType: data.locationType ?? 'BOTH',
    });
    return response.data;
  },

  async removeFavorite(locationId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/favorite-locations?locationId=${locationId}`);
    return response.data;
  },
};
