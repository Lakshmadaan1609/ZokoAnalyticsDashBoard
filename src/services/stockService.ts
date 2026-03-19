import api from './api';
import { DistributionCreate, DistributionRecord } from '@/types/apiTypes';

function unwrapDistributionList(data: unknown): DistributionRecord[] {
  if (Array.isArray(data)) return data as DistributionRecord[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const arr = obj.data ?? obj.results ?? obj.items ?? obj.distributions;
    if (Array.isArray(arr)) return arr as DistributionRecord[];
    if (typeof obj.cart_id === 'number') {
      return [data as DistributionRecord];
    }
  }
  return [];
}

const DISTRIBUTION_ITEM_KEYS = [
  'veg', 'paneer', 'chicken', 'cheesecorn', 'springroll', 'attaveg', 'attachicken',
] as const;

/** Today's date in local timezone (YYYY-MM-DD). Avoids UTC midnight shifting the day. */
function todayYmdLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Compare API date / created_at to YYYY-MM-DD (handles ISO strings). */
function normalizeDistributionDate(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  const ymd = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd;
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  return null;
}

function recordMatchesBusinessDate(record: DistributionRecord, targetYmd: string): boolean {
  const target = targetYmd.slice(0, 10);
  const fromDate = normalizeDistributionDate(record.date);
  if (fromDate) return fromDate === target;
  const fromCreated = normalizeDistributionDate(record.created_at);
  if (fromCreated) return fromCreated === target;
  return false;
}

function mergeDistributionPayload(
  existing: DistributionRecord,
  incoming: DistributionCreate
): DistributionCreate & { id?: number } {
  const merged: Record<string, unknown> = {
    cart_id: incoming.cart_id,
    id: existing.id,
    date: incoming.date ?? existing.date,
  };
  for (const key of DISTRIBUTION_ITEM_KEYS) {
    const prev = (existing[key as keyof DistributionRecord] as number) ?? 0;
    const add = (incoming[key as keyof DistributionCreate] as number) ?? 0;
    if (prev + add > 0) {
      merged[key] = prev + add;
    }
  }
  return merged as unknown as DistributionCreate & { id?: number };
}

export const stockService = {
  getAll: async (params?: { cart_id?: number; date?: string; limit?: number; offset?: number }): Promise<DistributionRecord[]> => {
    const response = await api.get('/distribution', { params });
    return unwrapDistributionList(response.data);
  },

  /**
   * List distributions for a cart (optionally filtered by date).
   * Uses query params — do NOT use GET /distribution/{id} here; on many APIs that path is the row **primary key**, not cart_id (404 "no distribution found for id").
   */
  getByCartId: async (cartId: number, date?: string): Promise<DistributionRecord[]> => {
    const response = await api.get('/distribution', {
      params: { cart_id: cartId, ...(date ? { date } : {}) },
    });
    return unwrapDistributionList(response.data);
  },

  distribute: async (data: DistributionCreate): Promise<DistributionRecord> => {
    const response = await api.post('/distribution', data);
    return response.data;
  },

  updateOrCreate: async (data: DistributionCreate & { id?: number }): Promise<DistributionRecord> => {
    const id = typeof data.id === 'number' && Number.isFinite(data.id) ? data.id : undefined;
    if (id != null) {
      try {
        const response = await api.put(`/distribution/${id}`, data);
        return response.data;
      } catch (e: unknown) {
        const status = (e as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          const response = await api.put('/distribution', data);
          return response.data;
        }
        throw e;
      }
    }
    const response = await api.put('/distribution', data);
    return response.data;
  },

  /**
   * Stock distribution: create a new row for a new business date,
   * otherwise update the existing row for that cart + date.
   */
  submitDistribution: async (data: DistributionCreate): Promise<DistributionRecord> => {
    const dateStr = data.date ?? todayYmdLocal();
    const payload: DistributionCreate = { ...data, date: dateStr };
    const targetYmd = dateStr.slice(0, 10);

    // Look for an existing row for this cart AND this business date (avoid strict string mismatch on ISO dates)
    let rows = await stockService.getAll({ cart_id: payload.cart_id, date: dateStr });
    let existing = rows.find(
      (d) => d.cart_id === payload.cart_id && recordMatchesBusinessDate(d, targetYmd)
    );

    if (!existing) {
      rows = await stockService.getByCartId(payload.cart_id);
      existing = rows.find(
        (d) => d.cart_id === payload.cart_id && recordMatchesBusinessDate(d, targetYmd)
      );
    }

    if (!existing) {
      rows = await stockService.getAll();
      existing = rows.find(
        (d) => d.cart_id === payload.cart_id && recordMatchesBusinessDate(d, targetYmd)
      );
    }

    if (!existing) {
      // No row yet for this cart on this date → POST (create new row)
      return stockService.distribute(payload);
    }

    // Same cart + date already exists → merge quantities and PUT
    const merged = mergeDistributionPayload(existing, payload);
    return stockService.updateOrCreate(merged);
  },
};
