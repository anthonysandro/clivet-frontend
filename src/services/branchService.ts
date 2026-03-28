// src/services/branchService.ts

import api from '@/api';

export interface Branch {
  tenantId: string;
  branchId: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const BranchService = {
  /**
   * 1. Obtener todas las sedes activas del tenant.
   * El backend filtra por defecto las isActive: true.
   */
  getAll: async (): Promise<Branch[]> => {
    const response = await api.get('/branches');
    // Manejamos la posibilidad de que venga envuelto en un objeto o como array directo
    return Array.isArray(response.data) ? response.data : (response.data.branches || []);
  },

  /**
   * 2. Obtener los detalles de una sede específica.
   */
  getOne: async (branchId: string): Promise<Branch> => {
    const response = await api.get(`/branches/${branchId}`);
    return response.data.branch || response.data;
  },

  /**
   * 3. Crear una nueva sede.
   * El backend genera el branchId (UUID) automáticamente.
   */
  create: async (data: Pick<Branch, 'name' | 'address' | 'phone'>): Promise<Branch> => {
    const response = await api.post('/branches', data);
    return response.data;
  },

  /**
   * 4. Actualizar datos de la sede.
   * Se usa PATCH para actualización parcial (nombre, dirección, teléfono, estado).
   */
  update: async (branchId: string, data: Partial<Omit<Branch, 'branchId' | 'tenantId'>>): Promise<Branch> => {
    const response = await api.patch(`/branches/${branchId}`, data);
    return response.data;
  },

  /**
   * 5. Eliminar sede (Soft Delete).
   * El backend marcará isActive: false.
   */
  delete: async (branchId: string): Promise<void> => {
    await api.delete(`/branches/${branchId}`);
  },
};