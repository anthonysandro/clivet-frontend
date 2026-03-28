import api from '@/api';

export interface BookingChannel {
  tenantId: string;
  bookingChannelId: string; // SK: C-CHANNEL#uuid
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const BookingChannelService = {
  /**
   * 1. Listar todos los canales de reserva del tenant.
   * El backend suele devolver la lista filtrada por tenant automáticamente.
   */
  getAll: async (): Promise<BookingChannel[]> => {
    const response = await api.get('/config/booking-channels');
    // Manejamos la respuesta asegurando que devuelva un array
    return Array.isArray(response.data) ? response.data : (response.data.channels || []);
  },

  /**
   * 2. Obtener un canal específico por ID.
   */
  getById: async (id: string): Promise<BookingChannel> => {
    const response = await api.get(`/config/booking-channels/${id}`);
    return response.data;
  },

  /**
   * 3. Crear un nuevo canal (Ej: "WhatsApp", "Web", "Llamada").
   * El backend aplica transformación: "whatsapp" -> "Whatsapp".
   */
  create: async (data: { name: string }): Promise<BookingChannel> => {
    const response = await api.post('/config/booking-channels', data);
    return response.data;
  },

  /**
   * 4. Actualizar un canal existente.
   * Permite cambiar el nombre o el estado (isActive).
   */
  update: async (id: string, data: Partial<Pick<BookingChannel, 'name' | 'isActive'>>): Promise<BookingChannel> => {
    const response = await api.patch(`/config/booking-channels/${id}`, data);
    return response.data;
  },

  /**
   * 5. Eliminar un canal de reserva.
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/config/booking-channels/${id}`);
  }
};