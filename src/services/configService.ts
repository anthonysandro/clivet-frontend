import api from '../api';

// --- INTERFACES ---

export interface ServiceType {
    serviceTypeId?: string;
    name: string;
    description?: string;
    isActive: boolean;
}

export interface ServiceCategory {
    categoryId?: string;
    serviceTypeId: string;
    name: string;
    isActive?: boolean;
}

export interface UserProfile {
    profileId: string;
    name: string;
    description?: string;
    isActive: boolean;
    aiRoleBase: 'admin' | 'groomer' | 'counter' | 'customer';
    menuOptions?: string[]; 
    permissions?: string[];
}

export interface MenuOption {
    menuId?: string;
    title: string;
    icon: string;
    path: string;
    order: number;
    isActive: boolean;
}

// ✅ Nueva Interfaz de Sede sincronizada con el backend
export interface Branch {
    branchId: string;
    name: string;
    address: string;
    phone: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

// --- SERVICIO ---

export const ConfigService = {
    // --- ⚙️ MANTENIMIENTO DE TIPOS DE SERVICIO ---
    getServiceTypes: async () => {
        const response = await api.get<ServiceType[]>('/config/service-types');
        return response.data;
    },

    createServiceType: async (data: Partial<ServiceType>) => {
        const response = await api.post<ServiceType>('/config/service-types', data);
        return response.data;
    },

    updateServiceType: async (id: string, data: Partial<ServiceType>) => {
        const response = await api.patch<ServiceType>(`/config/service-types/${id}`, data);
        return response.data;
    },

    // --- 📂 MANTENIMIENTO DE CATEGORÍAS ---
    getCategories: async (serviceTypeId?: string) => {
        const url = serviceTypeId 
            ? `/config/categories?serviceTypeId=${serviceTypeId}` 
            : '/config/categories';
        const response = await api.get<ServiceCategory[]>(url);
        return response.data;
    },

    createCategory: async (data: Partial<ServiceCategory>) => {
        const response = await api.post<ServiceCategory>('/config/categories', data);
        return response.data;
    },

    updateCategory: async (id: string, data: Partial<ServiceCategory>) => {
        const response = await api.patch<ServiceCategory>(`/config/categories/${id}`, data);
        return response.data;
    },

    // --- 👤 MANTENIMIENTO DE PERFILES ---
    getProfiles: async () => {
        const response = await api.get<UserProfile[]>('/config/profiles');
        return response.data;
    },

    getProfileById: async (id: string) => {
        const response = await api.get<UserProfile>(`/config/profiles/${id}`);
        return response.data;
    },

    createProfile: async (data: Partial<UserProfile>) => {
        const response = await api.post<UserProfile>('/config/profiles', data);
        return response.data;
    },

    updateProfile: async (id: string, data: Partial<UserProfile>) => {
        const response = await api.patch<UserProfile>(`/config/profiles/${id}`, data);
        return response.data;
    },

    // --- 📋 MANTENIMIENTO DE OPCIONES DE MENÚ ---
    getMenuOptions: async () => {
        const response = await api.get<MenuOption[]>('/config/menus');
        return response.data;
    },

    createMenuOption: async (data: Partial<MenuOption>) => {
        const response = await api.post<MenuOption>('/config/menus', data);
        return response.data;
    },

    updateMenuOption: async (id: string, data: Partial<MenuOption>) => {
        const response = await api.patch<MenuOption>(`/config/menus/${id}`, data);
        return response.data;
    },

    // --- 📍 MANTENIMIENTO DE SEDES (BRANCHES) ---
    // ✅ Agregado para centralizar la configuración de locales
    getBranches: async (): Promise<Branch[]> => {
        const response = await api.get('/branches');
        return Array.isArray(response.data) ? response.data : (response.data.branches || []);
    },

    getBranchById: async (id: string): Promise<Branch> => {
        const response = await api.get(`/branches/${id}`);
        return response.data;
    },

    createBranch: async (data: Partial<Branch>): Promise<Branch> => {
        const response = await api.post('/branches', data);
        return response.data;
    },

    updateBranch: async (id: string, data: Partial<Branch>): Promise<Branch> => {
        const response = await api.patch(`/branches/${id}`, data);
        return response.data;
    },

    // --- 🗑️ ELIMINACIÓN / DESACTIVACIÓN ---
    deleteServiceType: async (id: string) => {
        return (await api.delete(`/config/service-types/${id}`)).data;
    },
    
    deleteCategory: async (id: string) => {
        return (await api.delete(`/config/categories/${id}`)).data;
    },

    deleteMenuOption: async (id: string) => {
        return (await api.delete(`/config/menus/${id}`)).data;
    },

    deleteBranch: async (id: string) => {
        return (await api.delete(`/branches/${id}`)).data;
    }
};