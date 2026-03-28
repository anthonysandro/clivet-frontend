// src/services/dayCloseService.ts

import api from '@/api';

export interface DayCloseByMethod {
  efectivo: number;
  tarjeta:  number;
  yape:     number;
  transferencia: number; // ✅ Añadido para consistencia con SaleOrder
}

export interface DayCloseDetail {
  orderId:        string;
  clientName:     string;
  total:          number;
  payments:       Array<{ method: string; amount: number }>;
  documentType:   string;
  documentNumber: string;
}

export interface DayClose {
  tenantId:        string;
  closeId:         string;      // SK: CLOSE#branchId#date
  branchId:        string;
  branchName:      string;
  date:            string;      // Formato YYYY-MM-DD
  totals:          DayCloseByMethod;
  totalGeneral:    number;
  ordersCount:     number;
  ordersDetail:    DayCloseDetail[];
  sentViaWhatsApp: boolean;
  closedBy:        string;      // Email del usuario que cerró caja
  closedAt:        string;
  isAutomatic:     boolean;     // true si fue por Cron, false si fue manual
}

export const dayCloseService = {

  /**
   * 1. Obtener información del día.
   * Si el día ya está cerrado, devuelve el registro histórico.
   * Si no está cerrado, devuelve un "Preview" basado en las órdenes actuales.
   */
  getOrPreview: async (branchId: string, date: string): Promise<{ dayClose: DayClose; isClosed: boolean }> => {
    const response = await api.get(`/day-close/${branchId}/${date}`);
    // Aseguramos estructura en caso de que el backend envíe totales parciales
    return response.data;
  },

  /**
   * 2. Ejecutar el Cierre de Caja.
   * Este método consolida las ventas y bloquea nuevas ediciones para esa fecha/sede.
   */
  closeDay: async (branchId: string, date: string): Promise<DayClose> => {
    const response = await api.post('/day-close', { branchId, date });
    return response.data.dayClose || response.data;
  },

  /**
   * 3. Notificar el resumen al dueño vía WhatsApp.
   * Útil para que el administrador vea el total de caja sin entrar al sistema.
   */
  sendWhatsApp: async (branchId: string, date: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/day-close/${branchId}/${date}/whatsapp`);
    return response.data;
  },

  /**
   * 4. Listar cierres históricos de una sede.
   */
  getHistory: async (branchId: string, limit: number = 30): Promise<DayClose[]> => {
    const response = await api.get(`/day-close/${branchId}/history`, { params: { limit } });
    return Array.isArray(response.data) ? response.data : (response.data.history || []);
  }
};