// src/services/saleOrderService.ts

import api from '@/api';

export type PaymentMethod  = 'EFECTIVO' | 'TARJETA' | 'YAPE';
export type DocumentType   = 'BOLETA' | 'FACTURA';
export type OrderStatus    = 'PENDIENTE' | 'PAGADO' | 'ANULADO';

export interface PaymentLine {
  method: PaymentMethod;
  amount: number;
}

export interface OrderItem {
  requestId?:  string;
  productId?:  string;
  description: string;
  memberName?: string;
  quantity:    number;
  unitPrice:   number;
  discount:    number;
  subtotal:    number;
}

export interface SaleOrder {
  orderId:        string;
  branchId:       string;
  branchName:     string;
  clientId:       string;
  clientName:     string;
  clientPhone:    string;
  documentType:   DocumentType;
  documentNumber: string;
  items:          OrderItem[];
  payments:       PaymentLine[];
  subtotal:       number;
  tax:            number;
  total:          number;
  status:         OrderStatus;
  createdBy:      string;
  createdAt:      string;
  paidAt?:        string;
}

export interface CreateOrderDTO {
  branchId:     string;
  branchName:   string;
  clientId:     string;
  clientName:   string;
  clientPhone:  string;
  documentType: DocumentType;
  items:        Omit<OrderItem, 'subtotal'>[];
}

export const saleOrderService = {

  create: async (data: CreateOrderDTO): Promise<SaleOrder> => {
    const response = await api.post('/sale-orders', data);
    return response.data.order;
  },

  list: async (branchId: string, date?: string, status?: string): Promise<SaleOrder[]> => {
    const params: any = { branchId };
    if (date)   params.date   = date;
    if (status) params.status = status;
    const response = await api.get('/sale-orders', { params });
    return response.data.orders || [];
  },

  getOne: async (orderId: string): Promise<SaleOrder> => {
    const response = await api.get(`/sale-orders/${orderId}`);
    return response.data.order;
  },

  pay: async (orderId: string, payments: PaymentLine[]): Promise<SaleOrder> => {
    const response = await api.patch(`/sale-orders/${orderId}/pay`, { payments });
    return response.data.order;
  },

  cancel: async (orderId: string, reason?: string): Promise<SaleOrder> => {
    const response = await api.patch(`/sale-orders/${orderId}/cancel`, { reason });
    return response.data.order;
  },
};