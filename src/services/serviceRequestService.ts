import api from "@/api";

export interface ServiceRequestItem {
  petId: string;
  petName: string;
  itemId: string;
  description: string;
  price: number;
  discount: number;
  // ✅ Sincronizados con el Backend Core para que la jerarquía se guarde en la orden
  serviceTypeId: string; 
  categoryId: string;
}

export interface CreateServiceRequestDTO {
  clientId: string;
  clientName: string;
  clientPhone: string;
  scheduledDate: string;
  timeSlot: string;
  items: ServiceRequestItem[];
}

export const serviceRequestService = {
  create: async (data: CreateServiceRequestDTO) => {
    const response = await api.post('/service-requests', data);
    return response.data;
  },

  search: async (params: { date?: string; status?: string; searchName?: string; searchPets?: string }) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== '')
    );
    const response = await api.get('/service-requests', { params: cleanParams });
    return response.data;
  },

  updateStatus: async (requestId: string, status: string) => {
    const response = await api.patch(`/service-requests/${requestId}/status`, { status });
    return response.data;
  },
};