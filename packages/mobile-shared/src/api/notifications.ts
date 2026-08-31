import { apiClient } from './client';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  data?: any;
  createdAt: string;
}

export const notificationsApi = {
  async getNotifications(): Promise<{ success: boolean; data: Notification[] }> {
    const response = await apiClient.get('/notifications');
    return response.data;
  },

  async markAsRead(notificationIds: string[]): Promise<{ success: boolean }> {
    const response = await apiClient.patch('/notifications', { notificationIds });
    return response.data;
  },

  async markAllAsRead(notifications: Notification[]): Promise<{ success: boolean }> {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (!unreadIds.length) return { success: true };
    return this.markAsRead(unreadIds);
  },
};
