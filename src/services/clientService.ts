import api from '../api';

export interface Client {
  tenantId: string;
  clientId: string; // SK: CLIENT#uuid
  name: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  source?: 'WHATSAPP' | 'WEB';
  createdAt?: string;
  updatedAt?: string;
}

export interface Pet {
  tenantId: string;
  memberId: string; // SK: MEMBER#uuid
  petId?: string;   // Alias por compatibilidad
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
  photoUrl?: string;
  createdAt?: string;
}

export const ClientService = {
  /**
   * 1. Obtener todos los clientes del tenant.
   */
  async getAll(): Promise<Client[]> {
    const response = await api.get<Client[]>('/clients');
    return response.data;
  },

  /**
   * 2. Buscar clientes por nombre, apellido o teléfono.
   * Utilizado en el buscador del Dashboard de ventas.
   */
  async search(query: string): Promise<Client[]> {
    if (!query) return [];
    const response = await api.get<Client[]>(`/clients/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  /**
   * 3. Obtener un cliente específico por su ID.
   */
  async getById(clientId: string): Promise<Client> {
    const response = await api.get<Client>(`/clients/${clientId}`);
    return response.data;
  },

  /**
   * 4. Crear un nuevo cliente.
   */
  async create(data: Partial<Omit<Client, 'clientId' | 'tenantId'>>): Promise<Client> {
    const response = await api.post('/clients', data);
    return response.data;
  },

  /**
   * 5. Actualizar datos del cliente (PATCH para parciales).
   */
  async update(clientId: string, data: Partial<Client>): Promise<Client> {
    const response = await api.patch(`/clients/${clientId}`, data);
    return response.data;
  },

  // --- MASCOTAS (MEMBERS) ---
  
  /**
   * 6. Listar todas las mascotas de un cliente.
   * Incluye lógica de normalización para asegurar que memberId y petId existan.
   */
  async getPets(clientId: string): Promise<Pet[]> {
    const response = await api.get<any[]>(`/clients/${clientId}/members`);
    
    return response.data.map(item => {
        const id = item.memberId || item.petId || (item.SK ? item.SK.replace('MEMBER#', '') : '');
        return {
            ...item,
            memberId: id,
            petId: id,
            speciesName: item.speciesName || item.species || 'Desconocido',
            breedName: item.breedName || item.breed || 'Desconocido'
        };
    });
  },

  /**
   * 7. Registrar una nueva mascota para un cliente.
   */
  async createPet(clientId: string, data: Partial<Omit<Pet, 'memberId' | 'clientId'>>): Promise<Pet> {
    const response = await api.post(`/clients/${clientId}/members`, data);
    return response.data;
  },

  /**
   * 8. Actualizar datos de la mascota.
   */
  async updatePet(clientId: string, memberId: string, data: Partial<Pet>): Promise<Pet> {
    // Soportamos que envíen petId o memberId en la URL
    const id = memberId || (data as any).petId;
    const response = await api.patch(`/clients/${clientId}/members/${id}`, data);
    return response.data;
  },

  /**
   * 9. Buscar mascotas globalmente (Opcional, para flujos rápidos).
   */
  async searchPets(query: string): Promise<Pet[]> {
    const response = await api.get<Pet[]>(`/members/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
};