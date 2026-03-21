import api from '@/api';

export interface Species {
  tenantId: string;   // ✅ Ahora incluimos el contexto del tenant
  speciesId: string;
  name: string;
  createdAt?: string;
}

export interface Breed {
  tenantId: string;   // ✅ Ahora incluimos el contexto del tenant
  breedId: string;
  speciesId: string;
  name: string;
  createdAt?: string;
}

export const CatalogService = {
  // --- ESPECIES ---
  getSpecies: async (): Promise<Species[]> => {
    // El backend ahora filtrará por el tenantId que viene en el Token o Header
    const response = await api.get('/species');
    return response.data;
  },
  
  // ✅ El createSpecies ahora debe asegurar que el backend reciba el nombre
  // y el tenantId (usualmente el backend lo asigna automáticamente del token)
  createSpecies: async (name: string): Promise<Species> => {
    const response = await api.post('/species', { name });
    return response.data;
  },

  deleteSpecies: async (id: string) => {
    await api.delete(`/species/${id}`);
  },

  // --- RAZAS ---
  getBreeds: async (speciesId: string): Promise<Breed[]> => {
    // Al pasar speciesId, el backend buscará bajo la PK: TENANT#ID y SK: CONFIG#BREED#SPECIES#
    const response = await api.get(`/species/${speciesId.toUpperCase()}/breeds`);
    return response.data;
  },

  createBreed: async (speciesId: string, name: string): Promise<Breed> => {
    const response = await api.post(`/species/${speciesId.toUpperCase()}/breeds`, { name });
    return response.data;
  },

  deleteBreed: async (speciesId: string, breedId: string) => {
    await api.delete(`/species/${speciesId.toUpperCase()}/breeds/${breedId.toUpperCase()}`);
  }
};