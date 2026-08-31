import { apiClient } from './client';

export interface SupportMessage {
  id: string;
  message: string;
  isStaff: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  messages: SupportMessage[];
}

export const supportApi = {
  async getTickets(): Promise<{ success: boolean; data: SupportTicket[] }> {
    const response = await apiClient.get('/support-tickets');
    return response.data;
  },

  async getTicketById(id: string): Promise<{ success: boolean; data: SupportTicket }> {
    const response = await apiClient.get(`/support-tickets/${id}`);
    return response.data;
  },

  async createTicket(input: {
    subject: string;
    description: string;
    priority?: string;
    bookingId?: string;
  }): Promise<{ success: boolean; data: SupportTicket }> {
    const response = await apiClient.post('/support-tickets', input);
    return response.data;
  },

  async addMessage(ticketId: string, message: string): Promise<{ success: boolean; data: SupportMessage }> {
    const response = await apiClient.post(`/support-tickets/${ticketId}/messages`, { message });
    return response.data;
  },
};
