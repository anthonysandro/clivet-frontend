// src/services/branchService.ts

import api from '@/api';

export interface Branch {
  branchId?:  string;
  name:       string;
  address:    string;
  phone:      string;
  schedule:   string;
  isActive:   boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const BranchService = {
  getAll: async (): Promise<Branch[]> => {
    const response = await api.get('/branches');
    return response.data.branches || response.data;
  },

  getOne: async (branchId: string): Promise<Branch> => {
    const response = await api.get(`/branches/${branchId}`);
    return response.data.branch || response.data;
  },

  create: async (data: Omit<Branch, 'branchId' | 'createdAt' | 'updatedAt'>): Promise<Branch> => {
    const response = await api.post('/branches', data);
    return response.data.branch || response.data;
  },

  update: async (branchId: string, data: Partial<Branch>): Promise<Branch> => {
    const response = await api.patch(`/branches/${branchId}`, data);
    return response.data.branch || response.data;
  },

  delete: async (branchId: string): Promise<void> => {
    await api.delete(`/branches/${branchId}`);
  },
};