import api from '@/api';
import { fetchUserAttributes } from 'aws-amplify/auth';

// ✅ Interfaz sincronizada con la entidad de Backend
export interface User {
  userId: string;
  email: string;
  name: string;
  profileId: string;    // Perfil dinámico
  branchId: string;     // ID de la Sede asignada
  branchName?: string;  // Nombre de la sede (desnormalizado)
  status: 'ACTIVE' | 'DISABLED' | 'PENDING';
  phone?: string;
  phoneNumber?: string;
  tenantId: string;
  createdAt?: string;
  updatedAt?: string;
}

export const UserService = {
  /**
   * 0. Obtener el perfil del usuario actual desde Cognito.
   * ✅ Vital para que la IA y el Dashboard reconozcan la sede tras el Login.
   */
  getMe: async (): Promise<Partial<User>> => {
    try {
      const attributes = await fetchUserAttributes();
      
      return {
        email: attributes.email,
        name: attributes.name,
        // AWS Amplify devuelve los atributos personalizados con el prefijo 'custom:'
        branchId: attributes['custom:branchId'],
        tenantId: attributes['custom:tenantId'],
        profileId: attributes['custom:profileId']
      };
    } catch (error) {
      console.error("Error al obtener atributos de Cognito:", error);
      throw error;
    }
  },

  /**
   * 1. Obtener todos los usuarios del Tenant actual.
   */
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data; 
  },

  /**
   * 2. Invitar un usuario.
   */
  invite: async (email: string, name: string, profileId: string, branchId: string, phone?: string): Promise<any> => {
    const response = await api.post('/users/invite', { 
      email, 
      name, 
      profileId, 
      branchId,
      phone 
    });
    return response.data;
  },

  /**
   * 3. Actualizar datos del usuario.
   */
  update: async (userId: string, data: Partial<Pick<User, 'name' | 'profileId' | 'branchId' | 'status' | 'phone' | 'phoneNumber'>>): Promise<any> => {
    const response = await api.patch(`/users/${userId}`, data);
    return response.data;
  },

  /**
   * 4. Cambiar contraseña.
   */
  resetPassword: async (userId: string, newPassword: string): Promise<any> => {
    const response = await api.patch(`/users/${userId}/password`, { newPassword });
    return response.data;
  }
};