// src/services/saleOrderService.ts

import api from '@/api';

export type PaymentMethod  = 'EFECTIVO' | 'TARJETA' | 'YAPE' | 'TRANSFERENCIA';
export type DocumentType   = 'BOLETA' | 'FACTURA' | 'NOTA_VENTA';
export type OrderStatus    = 'PENDIENTE' | 'PAGADO' | 'ANULADO';

export interface PaymentLine {
  method: PaymentMethod;
  amount: number;
  reference?: string; // Ej: Número de operación de Yape o Transferencia
}

export interface OrderItem {
  requestId?:  string; // ✅ Crucial para vincular con ServiceRequest
  productId?:  string;
  description: string;
  memberName?: string; // Nombre de la mascota
  quantity:    number;
  unitPrice:   number;
  discount:    number;
  subtotal:    number;
}

export interface SaleOrder {
  tenantId:       string;
  orderId:        string;      // SK: SALE#uuid
  branchId:       string;
  branchName:     string;
  clientId:       string;
  clientName:     string;
  clientPhone:    string;
  documentType:   DocumentType;
  documentNumber?: string;      // Correlativo generado por el backend
  items:          OrderItem[];
  payments:       PaymentLine[];
  subtotal:       number;
  tax:            number;
  total:          number;
  status:         OrderStatus;
  createdBy:      string;      // Email del usuario que realizó la venta
  createdAt:      string;
  paidAt?:        string;
  notes?:         string;
}

export interface CreateOrderDTO {
  branchId:     string;
  branchName:   string;
  clientId:     string;
  clientName:   string;
  clientPhone:  string;
  documentType: DocumentType;
  items:        Omit<OrderItem, 'subtotal'>[];
  payments?:    PaymentLine[]; // Si se paga en el momento de crear
  notes?:       string;
}

export const saleOrderService = {

  /**
   * 1. Crear una nueva Orden de Venta.
   * El backend procesará los requestId incluidos en los items para marcarlos como PAID.
   */
  create: async (data: CreateOrderDTO): Promise<SaleOrder> => {
    const response = await api.post('/sale-orders', data);
    // Manejamos la respuesta directa o envuelta en .order
    return response.data.order || response.data;
  },

  /**
   * 2. Listar órdenes de venta filtradas por sede y opcionalmente fecha/estado.
   * Vital para el Dashboard de Administración y reportes.
   */
  list: async (params: { branchId: string; date?: string; status?: string }): Promise<SaleOrder[]> => {
    const response = await api.get('/sale-orders', { params });
    return Array.isArray(response.data) ? response.data : (response.data.orders || []);
  },

  /**
   * 3. Obtener el detalle completo de una orden.
   */
  getOne: async (orderId: string): Promise<SaleOrder> => {
    const response = await api.get(`/sale-orders/${orderId}`);
    return response.data.order || response.data;
  },

  /**
   * 4. Procesar el pago de una orden que estaba PENDIENTE.
   */
  pay: async (orderId: string, payments: PaymentLine[]): Promise<SaleOrder> => {
    const response = await api.patch(`/sale-orders/${orderId}/pay`, { payments });
    return response.data.order || response.data;
  },

  /**
   * 5. Anular una orden de venta.
   * El backend debería revertir el estado de los ServiceRequests vinculados si aplica.
   */
  cancel: async (orderId: string, reason?: string): Promise<SaleOrder> => {
    const response = await api.patch(`/sale-orders/${orderId}/cancel`, { reason });
    return response.data.order || response.data;
  },

  /**
   * 6. Resumen de ventas por sede (para pre-cierre del día).
   */
  getSummary: async (branchId: string, date: string): Promise<{ total: number; count: number; byMethod: Record<string, number> }> => {
    const response = await api.get(`/day-close/${branchId}/${date}/summary`);
    return response.data;
  }
};