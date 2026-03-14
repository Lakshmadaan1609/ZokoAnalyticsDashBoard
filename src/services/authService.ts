import api from './api';
import { LoginResponse } from '@/types/apiTypes';

export const authService = {
  login: async (pin: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { pin });
    return response.data;
  },
};
