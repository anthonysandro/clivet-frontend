import api from '../api';

export interface Client {
  tenantId: string;
  clientId: string;
  name: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  source?: 'WHATSAPP' | 'WEB';
  createdAt?: string;
}

export interface Pet {
  tenantId: string;
  memberId: string; // ✅ Cambiado de petId a memberId para consistencia total
  petId?: string;   // ✅ Mantenemos petId como opcional por compatibilidad
  clientId: string;
  name: string;
  speciesId: string;
  speciesName: string;
  breedId: string;
  breedName: string;
  birthDate?: string;
  gender?: 'M' | 'F'; 
  weight?: number;
  color?: string;
  notes?: string;
  behavior?: 'AGRESIVO' | 'TRANQUILO' | 'MIEDOSO' | 'INQUIETO';
}

export const ClientService = {
  async getAll() {
    const response = await api.get<Client[]>('/clients');
    return response.data;
  },

  async search(query: string) {
    const response = await api.get<Client[]>(`/clients/search?q=${query}`);
    return response.data;
  },

  async create(data: Partial<Client>) {
    const response = await api.post('/clients', data);
    return response.data;
  },

  async update(clientId: string, data: Partial<Client>) {
    const response = await api.patch(`/clients/${clientId}`, data);
    return response.data;
  },

  // --- MASCOTAS (MEMBERS) ---
  
  async getPets(clientId: string): Promise<Pet[]> {
    const response = await api.get<any[]>(`/clients/${clientId}/members`);
    
    return response.data.map(item => ({
        ...item,
        // ✅ Forzamos que ambos IDs existan para evitar errores de propiedad
        memberId: item.memberId || item.petId || (item.PK ? item.PK.replace('MEMBER#', '') : ''),
        petId: item.memberId || item.petId || (item.PK ? item.PK.replace('MEMBER#', '') : ''),
        speciesName: item.speciesName || item.species,
        breedName: item.breedName || item.breed
    }));
  },

  async createPet(clientId: string, data: Partial<Pet>) {
    const response = await api.post(`/clients/${clientId}/members`, data);
    return response.data;
  },

  async updatePet(clientId: string, petId: string, data: Partial<Pet>) {
    const response = await api.patch(`/clients/${clientId}/members/${petId}`, data);
    return response.data;
  }
};