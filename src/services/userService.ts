import api from '@/api';

// ✅ Interfaz actualizada con profileId dinámico
export interface User {
  userId: string;
  email: string;
  name?: string;
  profileId: string; // 👈 Cambiado de role a profileId
  status: 'ACTIVE' | 'DISABLED' | 'PENDING';
  phone?: string;
  tenantId: string;
}

export const UserService = {
  // 1. Obtener todos los usuarios del Tenant
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data; 
  },

  // 2. Invitar un usuario (Ahora usa profileId)
  invite: async (email: string, name: string, profileId: string, phone?: string) => {
    // Enviamos profileId para que el backend asocie el perfil dinámico de DynamoDB
    const response = await api.post('/users/invite', { 
      email, 
      name, 
      profileId, // 👈 Sincronizado con el Handler del Backend
      phone 
    });
    return response.data;
  },

  // 3. Actualizar datos (Se usa PATCH para actualizaciones parciales)
  update: async (userId: string, data: Partial<User>) => {
    const response = await api.patch(`/users/${userId}`, data);
    return response.data;
  },

  // 4. Cambiar contraseña (Reset forzado por Admin)
  resetPassword: async (userId: string, newPassword: string) => {
    const response = await api.put(`/users/${userId}/password`, { newPassword });
    return response.data;
  }
};