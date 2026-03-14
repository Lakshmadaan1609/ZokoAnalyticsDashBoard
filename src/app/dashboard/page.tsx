'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAnalytics } from '@/hooks/useAnalytics';
import { formatCurrency } from '@/utils/helpers';
import RevenueChart from '@/components/charts/revenue-chart';
import CartPerformanceChart from '@/components/charts/cart-performance-chart';
import ItemPerformanceChart from '@/components/charts/item-performance-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  Truck,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const {
    stats,
    isLoadingStats,
    revenue,
    isLoadingRevenue,
    cartPerformance,
    isLoadingCartPerformance,
    itemSales,
    isLoadingItemSales,
    refetchAll,
  } = useAnalytics();

  const kpiCards = [
    {
      title: 'Total Momos Produced',
      value: stats?.totalMomosProduced ?? 0,
      icon: TrendingUp,
      gradient: 'from-orange-500 to-amber-500',
      shadowColor: 'shadow-orange-500/20',
      bgGlow: 'bg-orange-500/10',
    },
    {
      title: 'Total Orders Today',
      value: stats?.totalOrders ?? 0,
      icon: ShoppingBag,
      gradient: 'from-violet-500 to-purple-600',
      shadowColor: 'shadow-violet-500/20',
      bgGlow: 'bg-violet-500/10',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue ?? 0),
      icon: IndianRupee,
      gradient: 'from-emerald-500 to-green-600',
      shadowColor: 'shadow-emerald-500/20',
      bgGlow: 'bg-emerald-500/10',
    },
    {
      title: 'Active Carts',
      value: stats?.activeCarts ?? 0,
      icon: Truck,
      gradient: 'from-cyan-500 to-blue-600',
      shadowColor: 'shadow-cyan-500/20',
      bgGlow: 'bg-cyan-500/10',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Dashboard
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500 sm:mt-1 sm:text-sm">
              Overview of today&apos;s operations and performance
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refetchAll}
            className="w-fit gap-2 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((kpi) => (
            <Card
              key={kpi.title}
              className="group relative overflow-hidden border-white/10 bg-zinc-900/50 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:shadow-lg"
            >
              <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${kpi.bgGlow} blur-2xl transition-all group-hover:scale-150`} />
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      {kpi.title}
                    </p>
                    {isLoadingStats ? (
                      <div className="h-8 w-20 animate-pulse rounded bg-zinc-800" />
                    ) : (
                      <p className="text-2xl font-bold text-white">
                        {kpi.value}
                      </p>
                    )}
                  </div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.gradient} shadow-lg ${kpi.shadowColor}`}
                  >
                    <kpi.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                {kpi.title === 'Total Revenue' && (
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase text-zinc-500">Cash</p>
                      <p className="text-sm font-bold text-zinc-300">{formatCurrency(stats?.totalCash ?? 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase text-zinc-500">UPI</p>
                      <p className="text-sm font-bold text-zinc-300">{formatCurrency(stats?.totalUpi ?? 0)}</p>
                    </div>
                  </div>
                )}
                <div className="mt-3 flex items-center gap-1 text-xs text-emerald-400">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>Today</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-base font-semibold text-zinc-200">
                Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <RevenueChart data={revenue} isLoading={isLoadingRevenue} />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-base font-semibold text-zinc-200">
                Cart Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <CartPerformanceChart
                data={cartPerformance}
                isLoading={isLoadingCartPerformance}
              />
            </CardContent>
          </Card>
        </div>

        {/* Item Performance */}
        <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-base font-semibold text-zinc-200">
              Best Selling Items
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ItemPerformanceChart
              data={itemSales}
              isLoading={isLoadingItemSales}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
