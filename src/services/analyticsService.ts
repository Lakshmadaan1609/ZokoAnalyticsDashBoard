import { cartService } from './cartService';
import { manufacturingService } from './manufacturingService';
import { stockService } from './stockService';
import { CartSalesRecord } from '@/types/apiTypes';

export const analyticsService = {
  getDashboardStats: async () => {
    const today = new Date().toISOString().split('T')[0];

    try {
      const [salesData, manufacturingData, distributionData] = await Promise.allSettled([
        cartService.getSalesByDate(today),
        manufacturingService.getByDate(today),
        stockService.getAll({ date: today }),
      ]);

      const sales = salesData.status === 'fulfilled' ? salesData.value : [];
      const manufacturing = manufacturingData.status === 'fulfilled' ? manufacturingData.value : null;
      const distribution = distributionData.status === 'fulfilled' ? distributionData.value : [];

      const totalRevenue = Array.isArray(sales) ? sales.reduce((sum: number, s: CartSalesRecord) => {
        return sum + (s.cash_total || 0) + (s.upi_total || 0);
      }, 0) : 0;

      const totalCash = Array.isArray(sales) ? sales.reduce((sum: number, s: CartSalesRecord) => sum + (s.cash_total || 0), 0) : 0;
      const totalUpi = Array.isArray(sales) ? sales.reduce((sum: number, s: CartSalesRecord) => sum + (s.upi_total || 0), 0) : 0;

      const totalOrders = Array.isArray(sales) ? sales.length : 0;

      const totalMomosProduced = manufacturing
        ? ((manufacturing.veg || 0) + (manufacturing.paneer || 0) + (manufacturing.chicken || 0) +
          (manufacturing.cheesecorn || 0) + (manufacturing.attaveg || 0) + (manufacturing.attachicken || 0)) * 40 +
          (manufacturing.springroll || 0)
        : 0;

      const activeCarts = Array.isArray(distribution) ? new Set(distribution.map((d) => d.cart_id)).size : 0;

      return {
        totalRevenue,
        totalCash,
        totalUpi,
        totalOrders,
        totalMomosProduced,
        activeCarts,
        salesData: Array.isArray(sales) ? sales : [],
        manufacturingData: manufacturing,
        distributionData: Array.isArray(distribution) ? distribution : [],
      };
    } catch {
      return {
        totalRevenue: 0,
        totalCash: 0,
        totalUpi: 0,
        totalOrders: 0,
        totalMomosProduced: 0,
        activeCarts: 0,
        salesData: [],
        manufacturingData: null,
        distributionData: [],
      };
    }
  },

  getRevenueByDateRange: async (days = 7) => {
    const results = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      try {
        const sales = await cartService.getSalesByDate(dateStr);
        const total = Array.isArray(sales) ? sales.reduce((sum: number, s: CartSalesRecord) => {
          return sum + (s.cash_total || 0) + (s.upi_total || 0);
        }, 0) : 0;
        const cash = Array.isArray(sales) ? sales.reduce((sum: number, s: CartSalesRecord) => sum + (s.cash_total || 0), 0) : 0;
        const upi = Array.isArray(sales) ? sales.reduce((sum: number, s: CartSalesRecord) => sum + (s.upi_total || 0), 0) : 0;

        results.push({ date: dateStr, total, cash, upi });
      } catch {
        results.push({ date: dateStr, total: 0, cash: 0, upi: 0 });
      }
    }
    return results;
  },

  getCartPerformance: async () => {
    const today = new Date().toISOString().split('T')[0];
    const cartIds = [1, 2, 3];
    const results = [];

    for (const cartId of cartIds) {
      try {
        const sales = await cartService.getSalesByCartId(cartId, today);
        const cashTotal = Array.isArray(sales)
          ? sales.reduce((sum: number, s: CartSalesRecord) => sum + (s.cash_total || 0), 0)
          : 0;
        const upiTotal = Array.isArray(sales)
          ? sales.reduce((sum: number, s: CartSalesRecord) => sum + (s.upi_total || 0), 0)
          : 0;
        const totalRevenue = cashTotal + upiTotal;

        results.push({
          cart_id: cartId,
          total_revenue: totalRevenue,
          total_orders: Array.isArray(sales) ? sales.length : 0,
          cash_total: cashTotal,
          upi_total: upiTotal,
        });
      } catch {
        results.push({
          cart_id: cartId,
          total_revenue: 0,
          total_orders: 0,
          cash_total: 0,
          upi_total: 0,
        });
      }
    }
    return results;
  },

  getItemSalesDistribution: async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const sales = await cartService.getSalesByDate(today);
      if (!Array.isArray(sales) || sales.length === 0) return [];

      const itemTotals: Record<string, number> = {};
      const itemNames: Record<string, string> = {
        vegsteam: 'Veg Steam', vegfried: 'Veg Fried', vegkurkure: 'Veg Kurkure',
        paneersteam: 'Paneer Steam', paneerfried: 'Paneer Fried', paneerkurkure: 'Paneer Kurkure',
        chickensteam: 'Chicken Steam', chickenfried: 'Chicken Fried', chickenkurkure: 'Chicken Kurkure',
        cheesecornsteam: 'Cheese Corn Steam', cheesecornfried: 'Cheese Corn Fried', cheesecornkurkure: 'Cheese Corn Kurkure',
        springroll: 'Spring Roll', springrollkurkure: 'Spring Roll Kurkure',
        attavegsteam: 'Atta Veg Steam', attachickensteam: 'Atta Chicken Steam',
      };

      for (const sale of sales) {
        for (const [key, name] of Object.entries(itemNames)) {
          const halfKey = `half_${key}` as keyof CartSalesRecord;
          const fullKey = `full_${key}` as keyof CartSalesRecord;
          const halfVal = (sale[halfKey] as number) || 0;
          const fullVal = (sale[fullKey] as number) || 0;
          if (halfVal + fullVal > 0) {
            itemTotals[name] = (itemTotals[name] || 0) + halfVal + fullVal;
          }
        }
      }

      return Object.entries(itemTotals).map(([item, quantity]) => ({ item, quantity }));
    } catch {
      return [];
    }
  },
};
