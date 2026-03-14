import api from './api';
import { CartSalesCreate, CartSalesRecord } from '@/types/apiTypes';

export const cartService = {
  getAllSales: async (params?: { cart_id?: number; date?: string; limit?: number; offset?: number }): Promise<CartSalesRecord[]> => {
    const response = await api.get('/sales', { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  getSalesByCartId: async (cartId: number, date?: string): Promise<CartSalesRecord[]> => {
    const response = await api.get(`/sales/${cartId}`, { params: date ? { date } : {} });
    return Array.isArray(response.data) ? response.data : [];
  },

  getSalesByDate: async (date: string, cartId?: number): Promise<CartSalesRecord[]> => {
    const response = await api.get(`/sales/date/${date}`, { params: cartId ? { cart_id: cartId } : {} });
    return Array.isArray(response.data) ? response.data : [];
  },

  createSale: async (data: CartSalesCreate): Promise<CartSalesRecord> => {
    const response = await api.post('/sales', data);
    return response.data;
  },

  updateOrCreateSale: async (data: CartSalesCreate): Promise<CartSalesRecord> => {
    const response = await api.put('/sales', data);
    return response.data;
  },
};
