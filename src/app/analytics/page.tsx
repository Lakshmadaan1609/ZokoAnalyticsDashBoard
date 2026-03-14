'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAnalytics } from '@/hooks/useAnalytics';
import RevenueChart from '@/components/charts/revenue-chart';
import CartPerformanceChart from '@/components/charts/cart-performance-chart';
import ItemPerformanceChart from '@/components/charts/item-performance-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';

export default function AnalyticsPage() {
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

  const summaryCards = [
    {
      label: 'Total Revenue (Today)',
      value: formatCurrency(stats?.totalRevenue ?? 0),
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Total Orders',
      value: stats?.totalOrders ?? 0,
      icon: BarChart3,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Items Produced',
      value: stats?.totalMomosProduced ?? 0,
      icon: Activity,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
    {
      label: 'Active Carts',
      value: stats?.activeCarts ?? 0,
      icon: PieChart,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Analytics
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500 sm:mt-1 sm:text-sm">
              Detailed metrics and performance insights
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

        {/* Summary Row */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.label} className="border-white/10 bg-zinc-900/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">{card.label}</p>
                  {isLoadingStats ? (
                    <div className="mt-1 h-5 w-16 animate-pulse rounded bg-zinc-800" />
                  ) : (
                    <p className="text-lg font-bold text-white">{card.value}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Chart */}
        <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-base font-semibold text-zinc-200">
                Daily Revenue (Last 7 Days)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <RevenueChart data={revenue} isLoading={isLoadingRevenue} />
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-violet-400" />
                <CardTitle className="text-base font-semibold text-zinc-200">
                  Cart Performance
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <CartPerformanceChart
                data={cartPerformance}
                isLoading={isLoadingCartPerformance}
              />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-orange-400" />
                <CardTitle className="text-base font-semibold text-zinc-200">
                  Item Sales Distribution
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ItemPerformanceChart
                data={itemSales}
                isLoading={isLoadingItemSales}
              />
            </CardContent>
          </Card>
        </div>

        {/* Stock Consumption Table */}
        <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              <CardTitle className="text-base font-semibold text-zinc-200">
                Stock Consumption
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoadingItemSales ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              </div>
            ) : itemSales.length === 0 ? (
              <div className="flex h-40 items-center justify-center">
                <p className="text-sm text-zinc-500">No consumption data available</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {itemSales.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3"
                  >
                    <span className="text-sm text-zinc-300">{item.item}</span>
                    <span className="rounded-lg bg-orange-500/10 px-2.5 py-0.5 text-sm font-bold text-orange-400">
                      {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
