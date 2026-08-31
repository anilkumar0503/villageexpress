import { apiClient } from './client';

export const profileApi = {
  async getProfile(): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.get('/profile/me');
    return response.data;
  },

  async updateProfile(data: {
    name?: string;
    phone?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
    vehicleType?: string;
    vehicleNumber?: string;
    shopName?: string;
  }): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.put('/profile/me', data);
    return response.data;
  },

  async updateFcmToken(fcmToken: string): Promise<{ success: boolean }> {
    const response = await apiClient.post('/profile/fcm-token', { fcmToken });
    return response.data;
  },

  // Set captain availability status (AVAILABLE | BUSY | OFF_DUTY)
  async setAvailability(
    status: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY',
  ): Promise<{ success: boolean; data: { availabilityStatus: string } }> {
    const response = await apiClient.put('/profile/availability', { availabilityStatus: status });
    return response.data;
  },

  // Legacy binary toggle — kept for compatibility, maps to AVAILABLE/OFF_DUTY
  async toggleAvailability(): Promise<{ success: boolean; data: { availabilityStatus: string } }> {
    // Read current status then flip; callers should prefer setAvailability directly
    const profileRes = await apiClient.get('/profile/me');
    const current = profileRes.data?.data?.captainProfile?.availabilityStatus ?? 'OFF_DUTY';
    const next = current === 'AVAILABLE' ? 'OFF_DUTY' : 'AVAILABLE';
    const response = await apiClient.put('/profile/availability', { availabilityStatus: next });
    return response.data;
  },

  async getWorkingHours(): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.get('/profile/working-hours');
    return response.data;
  },

  async updateWorkingHours(hours: any): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.put('/profile/working-hours', hours);
    return response.data;
  },

  // Captain onboarding — submits vehicle info + KYC doc URLs
  async submitOnboarding(data: {
    aadhaarNumber?: string;
    aadhaarFileUrl?: string;
    drivingLicense?: string;
    licenseFileUrl?: string;
    vehicleType: string;
    vehicleNumber: string;
    districtIds: string[];
    selectedPoints: string[];
  }): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.post('/profile/onboarding', data);
    return response.data;
  },

  /**
   * Upload a KYC document photo to cloud storage (Linode/S3) via presigned URL.
   *
   * @param localUri  Local file:// URI returned by expo-image-picker
   * @param folder    One of: 'aadhaar' | 'driving-license' | 'kyc-documents'
   * @param mimeType  MIME type of the image (default: 'image/jpeg')
   * @returns         The permanent public URL stored in cloud storage
   */
  async uploadDocument(
    localUri: string,
    folder: 'aadhaar' | 'driving-license' | 'kyc-documents',
    mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg',
  ): Promise<string> {
    // Step 1: Get a presigned upload URL from the server
    const presignRes = await apiClient.post('/upload/presign', { folder, mimeType });
    if (!presignRes.data?.success) {
      throw new Error(presignRes.data?.error ?? 'Failed to get upload URL');
    }
    const { uploadUrl, publicUrl } = presignRes.data.data as {
      uploadUrl: string;
      publicUrl: string;
    };

    // Step 2: Read the local file as a blob and upload it directly to cloud storage
    const fileRes = await fetch(localUri);
    const blob = await fileRes.blob();

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': mimeType },
      body: blob,
    });

    if (!uploadRes.ok) {
      throw new Error(`File upload failed: HTTP ${uploadRes.status}`);
    }

    // Step 3: Return the permanent cloud URL
    return publicUrl;
  },
};
