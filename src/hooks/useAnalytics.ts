'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analyticsService';

export function useAnalytics() {
  const dashboardQuery = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => analyticsService.getDashboardStats(),
    staleTime: 60000,
    refetchInterval: 120000,
  });

  const revenueQuery = useQuery({
    queryKey: ['revenue-trend'],
    queryFn: () => analyticsService.getRevenueByDateRange(7),
    staleTime: 60000,
  });

  const cartPerformanceQuery = useQuery({
    queryKey: ['cart-performance'],
    queryFn: () => analyticsService.getCartPerformance(),
    staleTime: 60000,
  });

  const itemSalesQuery = useQuery({
    queryKey: ['item-sales'],
    queryFn: () => analyticsService.getItemSalesDistribution(),
    staleTime: 60000,
  });

  return {
    stats: dashboardQuery.data,
    isLoadingStats: dashboardQuery.isLoading,
    revenue: revenueQuery.data || [],
    isLoadingRevenue: revenueQuery.isLoading,
    cartPerformance: cartPerformanceQuery.data || [],
    isLoadingCartPerformance: cartPerformanceQuery.isLoading,
    itemSales: itemSalesQuery.data || [],
    isLoadingItemSales: itemSalesQuery.isLoading,
    refetchAll: () => {
      dashboardQuery.refetch();
      revenueQuery.refetch();
      cartPerformanceQuery.refetch();
      itemSalesQuery.refetch();
    },
  };
}
