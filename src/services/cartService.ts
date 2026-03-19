import api from './api';
import { CartSalesCreate, CartSalesRecord } from '@/types/apiTypes';

function unwrapSalesList(data: unknown): CartSalesRecord[] {
  if (Array.isArray(data)) return data as CartSalesRecord[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const arr = obj.data ?? obj.results ?? obj.items ?? obj.sales;
    if (Array.isArray(arr)) return arr as CartSalesRecord[];
    if (typeof obj.cart_id === 'number') {
      return [data as CartSalesRecord];
    }
  }
  return [];
}

/** Fields merged additively when updating an existing sale row for the same date */
const CART_SALES_MERGE_KEYS = [
  'half_vegsteam',
  'full_vegsteam',
  'half_vegfried',
  'full_vegfried',
  'half_vegkurkure',
  'full_vegkurkure',
  'half_paneersteam',
  'full_paneersteam',
  'half_paneerfried',
  'full_paneerfried',
  'half_paneerkurkure',
  'full_paneerkurkure',
  'half_chickensteam',
  'full_chickensteam',
  'half_chickenfried',
  'full_chickenfried',
  'half_chickenkurkure',
  'full_chickenkurkure',
  'half_cheesecornsteam',
  'full_cheesecorsteamn',
  'half_cheesecornfried',
  'full_cheesecornfried',
  'half_cheesecornkurkure',
  'full_cheesecornkurkure',
  'half_springroll',
  'full_springroll',
  'half_springrollkurkure',
  'full_springrollkurkure',
  'half_attavegsteam',
  'full_attavegsteam',
  'half_attachickensteam',
  'full_attachickensteam',
  'cash_total',
  'upi_total',
  'Shift_timing',
] as const satisfies readonly (keyof CartSalesCreate)[];

function mergeCartSalesPayload(
  existing: CartSalesRecord,
  incoming: CartSalesCreate,
  dateStr: string
): CartSalesCreate & { id?: number } {
  const merged: Record<string, unknown> = {
    cart_id: incoming.cart_id,
    id: existing.id,
    date: dateStr,
  };

  for (const key of CART_SALES_MERGE_KEYS) {
    const prev = (existing[key as keyof CartSalesRecord] as number) ?? 0;
    const add = (incoming[key as keyof CartSalesCreate] as number) ?? 0;
    merged[key] = prev + add;
  }

  return merged as unknown as CartSalesCreate & { id?: number };
}

export const cartService = {
  getAllSales: async (params?: { cart_id?: number; date?: string; limit?: number; offset?: number }): Promise<CartSalesRecord[]> => {
    const response = await api.get('/sales', { params });
    return unwrapSalesList(response.data);
  },

  getSalesByCartId: async (cartId: number, date?: string): Promise<CartSalesRecord[]> => {
    const response = await api.get(`/sales/${cartId}`, { params: date ? { date } : {} });
    return unwrapSalesList(response.data);
  },

  getSalesByDate: async (date: string, cartId?: number): Promise<CartSalesRecord[]> => {
    const response = await api.get(`/sales/date/${date}`, { params: cartId ? { cart_id: cartId } : {} });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      const arr =
        (data as Record<string, unknown>)['data'] ??
        (data as Record<string, unknown>)['sales'] ??
        (data as Record<string, unknown>)['items'] ??
        (data as Record<string, unknown>)['results'];
      if (Array.isArray(arr)) return arr as CartSalesRecord[];
    }
    return [];
  },

  createSale: async (data: CartSalesCreate): Promise<CartSalesRecord> => {
    const response = await api.post('/sales', data);
    return response.data;
  },

  updateOrCreateSale: async (data: CartSalesCreate): Promise<CartSalesRecord> => {
    const response = await api.put('/sales', data);
    return response.data;
  },

  /**
   * POST when no sale row exists for this cart + date; otherwise PUT with merged quantities/totals.
   */
  submitOrderForDate: async (data: CartSalesCreate, date?: string): Promise<CartSalesRecord> => {
    const dateStr = date ?? data.date ?? new Date().toISOString().split('T')[0];
    const payload: CartSalesCreate = { ...data, date: dateStr };

    let rows = await cartService.getSalesByCartId(data.cart_id, dateStr);
    let existing = rows.find((r) => r.cart_id === data.cart_id) ?? rows[0];

    if (!existing) {
      const byDate = await cartService.getSalesByDate(dateStr, data.cart_id);
      existing = byDate.find((r) => r.cart_id === data.cart_id) ?? byDate[0];
    }

    if (!existing) {
      return cartService.createSale(payload);
    }

    const merged = mergeCartSalesPayload(existing, payload, dateStr);
    return cartService.updateOrCreateSale(merged);
  },
};
