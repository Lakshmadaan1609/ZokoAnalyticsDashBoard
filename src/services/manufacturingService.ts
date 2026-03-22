import api, { unwrapList } from './api';
import { ManufacturingCreate, ManufacturingRecord } from '@/types/apiTypes';

export const manufacturingService = {
  getAll: async (limit = 100, offset = 0): Promise<ManufacturingRecord[]> => {
    const response = await api.get('/manufacturing', { params: { limit, offset } });
    return unwrapList<ManufacturingRecord>(response.data);
  },

  getByDate: async (date: string): Promise<ManufacturingRecord> => {
    const response = await api.get(`/manufacturing/${date}`);
    return response.data;
  },

  create: async (data: ManufacturingCreate): Promise<ManufacturingRecord> => {
    const response = await api.post('/manufacturing', data);
    return response.data;
  },

  updateOrCreate: async (data: ManufacturingCreate): Promise<ManufacturingRecord> => {
    const response = await api.put('/manufacturing', data);
    return response.data;
  },
};
