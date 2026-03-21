import api from '@/api';

export interface BookingChannel {
  bookingChannelId?: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
}

export const BookingChannelService = {
  // Req 1.1: Listar
  getAll: async (): Promise<BookingChannel[]> => {
    const response = await api.get('/config/booking-channels');
    return response.data;
  },

  // Req 2: Crear
  create: async (data: { name: string }): Promise<BookingChannel> => {
    const response = await api.post('/config/booking-channels', data);
    return response.data;
  },

  // Req 3: Actualizar
  update: async (id: string, data: Partial<BookingChannel>): Promise<BookingChannel> => {
    const response = await api.patch(`/config/booking-channels/${id}`, data);
    return response.data;
  }
};