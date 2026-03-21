// src/services/dayCloseService.ts

import api from '@/api';

export interface DayCloseByMethod {
  efectivo: number;
  tarjeta:  number;
  yape:     number;
}

export interface DayClose {
  closeId:         string;
  branchId:        string;
  branchName:      string;
  date:            string;
  totals:          DayCloseByMethod;
  totalGeneral:    number;
  ordersCount:     number;
  ordersDetail:    Array<{
    orderId:        string;
    clientName:     string;
    total:          number;
    payments:       Array<{ method: string; amount: number }>;
    documentType:   string;
    documentNumber: string;
  }>;
  sentViaWhatsApp: boolean;
  closedBy:        string;
  closedAt:        string;
  isAutomatic:     boolean;
}

export const dayCloseService = {

  getOrPreview: async (branchId: string, date: string): Promise<{ dayClose: DayClose; isClosed: boolean }> => {
    const response = await api.get(`/day-close/${branchId}/${date}`);
    return response.data;
  },

  closeDay: async (branchId: string, date?: string): Promise<DayClose> => {
    const response = await api.post('/day-close', { branchId, date });
    return response.data.dayClose;
  },

  sendWhatsApp: async (branchId: string, date: string): Promise<void> => {
    await api.post(`/day-close/${branchId}/${date}/whatsapp`);
  },
};