import api, { unwrapList } from './api';
import { DistributionCreate, DistributionRecord } from '@/types/apiTypes';

export const stockService = {
  getAll: async (params?: { cart_id?: number; date?: string; limit?: number; offset?: number }): Promise<DistributionRecord[]> => {
    const response = await api.get('/distribution', { params });
    return unwrapList<DistributionRecord>(response.data);
  },

  getByCartId: async (cartId: number, date?: string): Promise<DistributionRecord[]> => {
    const response = await api.get(`/distribution/${cartId}`, { params: date ? { date } : {} });
    return unwrapList<DistributionRecord>(response.data);
  },

  distribute: async (data: DistributionCreate): Promise<DistributionRecord> => {
    const response = await api.post('/distribution', data);
    return response.data;
  },

  updateOrCreate: async (data: DistributionCreate): Promise<DistributionRecord> => {
    const response = await api.put('/distribution', data);
    return response.data;
  },
};
