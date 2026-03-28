import api from "@/api";

export interface ServiceRequestItem {
  petId: string;
  petName: string;
  itemId: string; // ID del Servicio o Producto
  description: string;
  price: number;
  discount: number;
  serviceTypeId: string; 
  categoryId: string;
}

export interface ServiceRequest {
  tenantId: string;
  requestId: string;      // SK: SR#uuid
  branchId: string;       // ✅ Vinculación con sede
  branchName?: string;    // Desnormalizado para UI
  clientId: string;
  clientName: string;
  clientPhone: string;
  scheduledDate: string;  // Formato YYYY-MM-DD
  timeSlot: string;       // Formato HH:MM
  items: ServiceRequestItem[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAID' | 'CANCELLED';
  saleOrderId?: string;   // ✅ Referencia a la orden de venta (agrupador)
  createdAt: string;
  updatedAt?: string;
}

export interface CreateServiceRequestDTO {
  branchId: string;       // ✅ Requerido para multitenancy de sedes
  clientId: string;
  clientName: string;
  clientPhone: string;
  scheduledDate: string;
  timeSlot: string;
  items: ServiceRequestItem[];
}

export const serviceRequestService = {
  /**
   * Crear una nueva solicitud de servicio.
   * Ahora incluye branchId para segmentar la operación.
   */
  create: async (data: CreateServiceRequestDTO): Promise<ServiceRequest> => {
    const response = await api.post('/service-requests', data);
    return response.data;
  },

  /**
   * Buscar solicitudes con filtros dinámicos.
   * ✅ Agregado branchId a la búsqueda para el cierre de caja.
   */
  search: async (params: { 
    date?: string; 
    status?: string; 
    searchName?: string; 
    searchPets?: string;
    branchId?: string; 
  }): Promise<ServiceRequest[]> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== '')
    );
    const response = await api.get('/service-requests', { params: cleanParams });
    // El backend suele devolver el array directamente en httpApi
    return Array.isArray(response.data) ? response.data : (response.data.items || []);
  },

  /**
   * Obtener una solicitud por ID.
   */
  getById: async (requestId: string): Promise<ServiceRequest> => {
    const response = await api.get(`/service-requests/${requestId}`);
    return response.data;
  },

  /**
   * Actualizar el estado de la solicitud.
   * Vital para el flujo: PENDING -> COMPLETED -> PAID (vía SaleOrder)
   */
  updateStatus: async (requestId: string, status: ServiceRequest['status']) => {
    const response = await api.patch(`/service-requests/${requestId}/status`, { status });
    return response.data;
  },

  /**
   * Listar solicitudes pendientes de pago en una sede específica.
   * Útil para la pantalla de "Cobros" donde se agruparán en una SaleOrder.
   */
  getUnpaidByBranch: async (branchId: string): Promise<ServiceRequest[]> => {
    const response = await api.get('/service-requests', { 
      params: { branchId, status: 'COMPLETED' } // Solo servicios realizados pero no cobrados
    });
    return Array.isArray(response.data) ? response.data : [];
  }
};