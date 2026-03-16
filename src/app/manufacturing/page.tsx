'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { useManufacturing } from '@/hooks/useManufacturing';
import { useForm } from 'react-hook-form';
import { ManufacturingCreate, ManufacturingRecord } from '@/types/apiTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Factory, Package, Loader2, RefreshCw, Calculator, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { useMemo, useRef, useCallback } from 'react';
import type { ChartData } from 'chart.js';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend, Filler);

// ── Item Config ──────────────────────────────────────────────
// Veg & Atta Veg: ₹5.25/pc × 40 pcs/kg = ₹210/kg
// Paneer, Chicken, Atta Chicken, Cheese Corn: ₹7/pc × 40 pcs/kg = ₹280/kg
// Spring Roll: ₹20/pc (unit = pcs)
// Sauces: ₹150/kg

const MANUFACTURING_FIELDS = [
  { key: 'veg', label: 'Veg Momos', icon: '🥟', color: 'from-green-500/20 to-green-600/10', unit: 'kg', costPerUnit: 210 },
  { key: 'paneer', label: 'Paneer Momos', icon: '🧀', color: 'from-yellow-500/20 to-yellow-600/10', unit: 'kg', costPerUnit: 280 },
  { key: 'chicken', label: 'Chicken Momos', icon: '🍗', color: 'from-red-500/20 to-red-600/10', unit: 'kg', costPerUnit: 280 },
  { key: 'cheesecorn', label: 'Cheese Corn', icon: '🌽', color: 'from-orange-500/20 to-orange-600/10', unit: 'kg', costPerUnit: 280 },
  { key: 'springroll', label: 'Spring Rolls', icon: '🌯', color: 'from-purple-500/20 to-purple-600/10', unit: 'pcs', costPerUnit: 20 },
  { key: 'attaveg', label: 'Atta Veg', icon: '🥬', color: 'from-cyan-500/20 to-cyan-600/10', unit: 'kg', costPerUnit: 320 },
  { key: 'attachicken', label: 'Atta Chicken', icon: '🍖', color: 'from-pink-500/20 to-pink-600/10', unit: 'kg', costPerUnit: 280 },
];

const SAUCE_FIELDS = [
  { key: 'chilli_sauce', label: 'Chilli Sauce', costPerKg: 150 },
  { key: 'special_sause', label: 'Special Sauce', costPerKg: 150 },
];

// Extended form type so sauces are entered as numbers (kg) for estimation
interface ManufacturingFormData {
  veg?: number;
  paneer?: number;
  chicken?: number;
  cheesecorn?: number;
  springroll?: number;
  attaveg?: number;
  attachicken?: number;
  chilli_sauce_kg?: number;
  special_sause_kg?: number;
  total_bill?: number;
}

export default function ManufacturingPage() {
  const { logs, isLoading, isDispatching, dispatch, refetch } = useManufacturing();
  const { register, handleSubmit, reset, watch } = useForm<ManufacturingFormData>();

  const ITEM_KEYS = ['veg', 'paneer', 'chicken', 'cheesecorn', 'springroll', 'attaveg', 'attachicken'] as const;
  const ITEM_LABELS: Record<string, string> = {
    veg: 'Veg', paneer: 'Paneer', chicken: 'Chicken', cheesecorn: 'Cheese Corn',
    springroll: 'Spring Roll', attaveg: 'Atta Veg', attachicken: 'Atta Chicken',
  };
  // Gradient color pairs [from, to] — muted, elegant
  const GRADIENT_PAIRS = [
    ['#065f46', '#34d399'],  // Veg — teal → emerald
    ['#78350f', '#fbbf24'],  // Paneer — amber → yellow
    ['#7f1d1d', '#f87171'],  // Chicken — dark red → rose
    ['#7c2d12', '#fb923c'],  // Cheese Corn — brown → orange
    ['#4c1d95', '#a78bfa'],  // Spring Roll — deep violet → lavender
    ['#164e63', '#22d3ee'],  // Atta Veg — dark cyan → cyan
    ['#831843', '#f472b6'],  // Atta Chicken — dark pink → pink
  ];
  // Fallback flat colors for legend swatches
  const FLAT_COLORS = ['#34d399', '#fbbf24', '#f87171', '#fb923c', '#a78bfa', '#22d3ee', '#f472b6'];

  const doughnutRef = useRef<ChartJS<'doughnut'>>(null);
  const barRef = useRef<ChartJS<'bar'>>(null);

  // Helper: create a vertical gradient from a canvas context
  const createGradient = useCallback((ctx: CanvasRenderingContext2D, height: number, from: string, to: string) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, from);
    gradient.addColorStop(1, to);
    return gradient;
  }, []);

  // ── Analytics computed from logs ──
  const analytics = useMemo(() => {
    const typedLogs = logs as ManufacturingRecord[];
    if (typedLogs.length === 0) return null;

    // Total produced per item across all logs
    const totals: Record<string, number> = {};
    for (const key of ITEM_KEYS) {
      totals[key] = typedLogs.reduce((sum, log) => sum + (Number((log as Record<string, unknown>)[key]) || 0), 0);
    }

    // Most & Least produced (Normalized to pieces for comparison: 1kg = 40pcs)
    const normalizedTotals: Record<string, number> = {};
    for (const key of ITEM_KEYS) {
      const isPcs = key === 'springroll';
      normalizedTotals[key] = totals[key] * (isPcs ? 1 : 40);
    }

    const sortedByNormalized = Object.entries(normalizedTotals).sort((a, b) => b[1] - a[1]);
    const mostKey = sortedByNormalized[0][0];
    const most = [mostKey, totals[mostKey]];

    const filteredForLeast = sortedByNormalized.filter(([, v]) => v > 0);
    const leastEntry = filteredForLeast.pop() || sortedByNormalized[sortedByNormalized.length - 1];
    const leastKey = leastEntry[0];
    const least = [leastKey, totals[leastKey]];

    // Average per day (Normalized to pieces)
    const totalAll = Object.entries(totals).reduce((sum, [key, val]) => sum + (val * (key === 'springroll' ? 1 : 40)), 0);
    const avgPerDay = typedLogs.length > 0 ? Math.round(totalAll / typedLogs.length) : 0;

    // Weekly data (last 7 logs, or all if fewer)
    const recentLogs = typedLogs.slice(0, 7).reverse();
    const weeklyLabels = recentLogs.map((log) => {
      const d = log.date || log.created_at;
      if (!d) return '—';
      const dt = new Date(d);
      return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    });
    const weeklyDatasets = ITEM_KEYS.map((key, i) => ({
      label: ITEM_LABELS[key],
      data: recentLogs.map((log) => {
        const val = Number((log as Record<string, unknown>)[key]) || 0;
        return val * (key === 'springroll' ? 1 : 40);
      }),
      backgroundColor: FLAT_COLORS[i],
      borderRadius: 4,
      borderSkipped: false as const,
    }));

    return { totals, normalizedTotals, most, least, avgPerDay, totalAll, weeklyLabels, weeklyDatasets, logCount: typedLogs.length };
  }, [logs]);

  // Watch all fields for live estimate
  const watchedValues = watch();

  // ── Calculate estimated total ──
  const estimatedTotal = (() => {
    let total = 0;

    for (const field of MANUFACTURING_FIELDS) {
      const qty = Number(watchedValues[field.key as keyof ManufacturingFormData]) || 0;
      total += qty * field.costPerUnit;
    }

    for (const sauce of SAUCE_FIELDS) {
      const kgKey = sauce.key === 'chilli_sauce' ? 'chilli_sauce_kg' : 'special_sause_kg';
      const qty = Number(watchedValues[kgKey as keyof ManufacturingFormData]) || 0;
      total += qty * sauce.costPerKg;
    }

    return total;
  })();

  const onSubmit = (data: ManufacturingFormData) => {
    const payload: ManufacturingCreate = {};

    // Map item fields
    for (const field of MANUFACTURING_FIELDS) {
      const val = Number(data[field.key as keyof ManufacturingFormData]);
      if (val > 0) {
        (payload as Record<string, unknown>)[field.key] = val;
      }
    }

    // Map sauce fields (send as string with "kg" suffix to the API)
    if (data.chilli_sauce_kg && Number(data.chilli_sauce_kg) > 0) {
      payload.chilli_sauce = `${data.chilli_sauce_kg} kg`;
    }
    if (data.special_sause_kg && Number(data.special_sause_kg) > 0) {
      payload.special_sause = `${data.special_sause_kg} kg`;
    }

    if (data.total_bill && Number(data.total_bill) > 0) {
      payload.total_bill = Number(data.total_bill);
    }

    dispatch(payload, {
      onSuccess: () => reset(),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Manufacturing
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500 sm:mt-1 sm:text-sm">
              Dispatch stock from central kitchen
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="w-fit gap-2 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Dispatch Form */}
        <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
          <CardHeader className="border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/20">
                <Factory className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base text-zinc-200">
                  Dispatch Stock
                </CardTitle>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Enter quantities to dispatch from kitchen
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Item Fields */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {MANUFACTURING_FIELDS.map((field) => (
                  <div
                    key={field.key}
                    className={`group space-y-2 rounded-xl border border-white/5 bg-gradient-to-br ${field.color} p-4 transition-all hover:border-white/10`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{field.icon}</span>
                        <Label className="text-sm font-medium text-zinc-300">
                          {field.label}
                        </Label>
                      </div>
                      <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        {field.unit}
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0"
                        {...register(field.key as keyof ManufacturingFormData, {
                          valueAsNumber: true,
                        })}
                        className="border-white/10 bg-zinc-800/50 pr-12 text-white placeholder:text-zinc-600 focus:border-orange-500/50"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-500">
                        {field.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sauces & Bill Row */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm text-zinc-400">Chilli Sauce</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      {...register('chilli_sauce_kg', { valueAsNumber: true })}
                      className="border-white/10 bg-zinc-800/50 pr-12 text-white placeholder:text-zinc-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-500">
                      kg
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-zinc-400">Special Sauce</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      {...register('special_sause_kg', { valueAsNumber: true })}
                      className="border-white/10 bg-zinc-800/50 pr-12 text-white placeholder:text-zinc-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-500">
                      kg
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-zinc-400">Total Bill (Actual)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      {...register('total_bill', { valueAsNumber: true })}
                      className="border-white/10 bg-zinc-800/50 pl-7 text-white placeholder:text-zinc-600"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-500">
                      ₹
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Estimated Cost Container ── */}
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-emerald-500/10 to-teal-500/5 p-3 sm:mt-5 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
                      <Calculator className="h-4.5 w-4.5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-emerald-400/70">
                        Estimated Raw Material Cost
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Auto-calculated from quantities entered above
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold tracking-tight transition-all duration-300 ${
                      estimatedTotal > 0 ? 'text-emerald-400' : 'text-zinc-600'
                    }`}>
                      {formatCurrency(estimatedTotal)}
                    </p>
                    {estimatedTotal > 0 && watchedValues.total_bill && Number(watchedValues.total_bill) > 0 && (
                      <p className={`mt-0.5 text-xs font-medium ${
                        Number(watchedValues.total_bill) > estimatedTotal
                          ? 'text-red-400'
                          : Number(watchedValues.total_bill) < estimatedTotal
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}>
                        {Number(watchedValues.total_bill) > estimatedTotal
                          ? `Actual is ₹${(Number(watchedValues.total_bill) - estimatedTotal).toLocaleString('en-IN')} above estimate`
                          : Number(watchedValues.total_bill) < estimatedTotal
                          ? `Actual is ₹${(estimatedTotal - Number(watchedValues.total_bill)).toLocaleString('en-IN')} below estimate`
                          : 'Matches estimate'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  type="submit"
                  disabled={isDispatching}
                  className="gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30"
                >
                  {isDispatching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                  {isDispatching ? 'Dispatching...' : 'Dispatch Stock'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── Manufacturing Analytics ── */}
        {!analytics ? (
          <div className="flex h-[300px] flex-col items-center justify-center rounded-xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm">
            <BarChart3 className="mb-3 h-8 w-8 text-zinc-600" />
            <p className="text-sm font-medium text-zinc-400">No Analytics Data Yet</p>
            <p className="text-xs text-zinc-600">Start dispatching stock to see trends</p>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              {/* Most Produced */}
              <Card className="border-white/10 bg-zinc-900/50">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Most Produced</p>
                    <p className="text-lg font-bold text-white">{ITEM_LABELS[analytics.most[0]]}</p>
                    <p className="text-xs text-emerald-400">{analytics.most[1]} {analytics.most[0] === 'springroll' ? 'pcs' : 'kg'} total</p>
                  </div>
                </CardContent>
              </Card>

              {/* Least Produced */}
              <Card className="border-white/10 bg-zinc-900/50">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
                    <TrendingDown className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Least Produced</p>
                    <p className="text-lg font-bold text-white">{ITEM_LABELS[analytics.least[0]]}</p>
                    <p className="text-xs text-amber-400">{analytics.least[1]} {analytics.least[0] === 'springroll' ? 'pcs' : 'kg'} total</p>
                  </div>
                </CardContent>
              </Card>

              {/* Average Per Day */}
              <Card className="border-white/10 bg-zinc-900/50">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
                    <BarChart3 className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Avg Production / Day</p>
                    <p className="text-lg font-bold text-white">{analytics.avgPerDay} units</p>
                    <p className="text-xs text-violet-400">across {analytics.logCount} records</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-5">
              {/* Doughnut — Production Distribution */}
              <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm lg:col-span-2">
                <CardHeader className="border-b border-white/5 pb-4">
                  <CardTitle className="text-base font-semibold text-zinc-200">
                    Production Distribution
                  </CardTitle>
                  <p className="text-xs text-zinc-500">Total quantity produced per item</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-[280px]">
                    <Doughnut
                      ref={doughnutRef}
                      data={{
                        labels: ITEM_KEYS.map((k) => ITEM_LABELS[k]),
                        datasets: [{
                          data: ITEM_KEYS.map((k) => analytics.normalizedTotals[k]),
                          backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { height: number } }; dataIndex: number }) => {
                            const c = ctx.chart;
                            const h = c.chartArea?.height ?? 280;
                            const i = ctx.dataIndex;
                            return createGradient(c.ctx, h, GRADIENT_PAIRS[i][0], GRADIENT_PAIRS[i][1]);
                          },
                          borderWidth: 0,
                          hoverOffset: 8,
                        }],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '60%',
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: { color: '#a1a1aa', font: { size: 11 }, usePointStyle: true, padding: 14, boxWidth: 8 },
                          },
                          tooltip: {
                            backgroundColor: '#18181b',
                            titleColor: '#f4f4f5',
                            bodyColor: '#a1a1aa',
                            borderColor: '#27272a',
                            borderWidth: 1,
                            padding: 12,
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Bar — Weekly Production Trend */}
              <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm lg:col-span-3">
                <CardHeader className="border-b border-white/5 pb-4">
                  <CardTitle className="text-base font-semibold text-zinc-200">
                    Weekly Production Trend
                  </CardTitle>
                  <p className="text-xs text-zinc-500">Last {analytics.weeklyLabels.length} production records</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-[280px]">
                    <Bar
                      ref={barRef}
                      data={{
                        labels: analytics.weeklyLabels,
                        datasets: analytics.weeklyDatasets.map((ds, i) => ({
                          ...ds,
                          backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { height: number } } }) => {
                            const c = ctx.chart;
                            const h = c.chartArea?.height ?? 280;
                            return createGradient(c.ctx, h, GRADIENT_PAIRS[i][0], GRADIENT_PAIRS[i][1]);
                          },
                        })),
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: { color: '#a1a1aa', font: { size: 10 }, usePointStyle: true, padding: 10, boxWidth: 8 },
                          },
                          tooltip: {
                            backgroundColor: '#18181b',
                            titleColor: '#f4f4f5',
                            bodyColor: '#a1a1aa',
                            borderColor: '#27272a',
                            borderWidth: 1,
                            padding: 12,
                          },
                        },
                        scales: {
                          x: {
                            stacked: true,
                            grid: { display: false },
                            ticks: { color: '#71717a', font: { size: 11 } },
                          },
                          y: {
                            stacked: true,
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: '#71717a', font: { size: 11 } },
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Manufacturing Logs */}
        <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-base text-zinc-200">
              Manufacturing Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2">
                <Factory className="h-8 w-8 text-zinc-700" />
                <p className="text-sm text-zinc-500">No manufacturing records yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-zinc-500">Date</TableHead>
                      <TableHead className="text-zinc-500">Veg <span className="text-zinc-600">(kg)</span></TableHead>
                      <TableHead className="text-zinc-500">Paneer <span className="text-zinc-600">(kg)</span></TableHead>
                      <TableHead className="text-zinc-500">Chicken <span className="text-zinc-600">(kg)</span></TableHead>
                      <TableHead className="text-zinc-500">Cheese Corn <span className="text-zinc-600">(kg)</span></TableHead>
                      <TableHead className="text-zinc-500">Spring Roll <span className="text-zinc-600">(pcs)</span></TableHead>
                      <TableHead className="text-zinc-500">Atta Veg <span className="text-zinc-600">(kg)</span></TableHead>
                      <TableHead className="text-zinc-500">Atta Chicken <span className="text-zinc-600">(kg)</span></TableHead>
                      <TableHead className="text-zinc-500">Bill</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(logs as ManufacturingRecord[]).map((log, i) => (
                      <TableRow
                        key={log.id || i}
                        className="border-white/5 transition-colors hover:bg-white/5"
                      >
                        <TableCell className="text-zinc-300">
                          {log.date ? formatDate(log.date) : log.created_at ? formatDate(log.created_at) : '-'}
                        </TableCell>
                        <TableCell className="text-zinc-400">{log.veg || 0} <span className="text-zinc-600">kg</span></TableCell>
                        <TableCell className="text-zinc-400">{log.paneer || 0} <span className="text-zinc-600">kg</span></TableCell>
                        <TableCell className="text-zinc-400">{log.chicken || 0} <span className="text-zinc-600">kg</span></TableCell>
                        <TableCell className="text-zinc-400">{log.cheesecorn || 0} <span className="text-zinc-600">kg</span></TableCell>
                        <TableCell className="text-zinc-400">{log.springroll || 0} <span className="text-zinc-600">pcs</span></TableCell>
                        <TableCell className="text-zinc-400">{log.attaveg || 0} <span className="text-zinc-600">kg</span></TableCell>
                        <TableCell className="text-zinc-400">{log.attachicken || 0} <span className="text-zinc-600">kg</span></TableCell>
                        <TableCell className="text-zinc-300">
                          {log.total_bill ? `₹${log.total_bill}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
