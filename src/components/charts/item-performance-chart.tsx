'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { ItemSales } from '@/types/apiTypes';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ItemPerformanceChartProps {
  data: ItemSales[];
  isLoading?: boolean;
}

const COLORS = [
  '#f97316', '#8b5cf6', '#22c55e', '#06b6d4', '#eab308',
  '#ef4444', '#ec4899', '#14b8a6', '#6366f1', '#84cc16',
  '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#d946ef',
  '#64748b',
];

const createRadialGradient = (
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number; top: number; bottom: number },
  baseColor: string
) => {
  const x = (chartArea.left + chartArea.right) / 2;
  const y = (chartArea.top + chartArea.bottom) / 2;
  const r = Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top) / 2;
  const gradient = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
  gradient.addColorStop(0, baseColor);
  gradient.addColorStop(1, `${baseColor}20`);
  return gradient;
};

export default function ItemPerformanceChart({ data, isLoading }: ItemPerformanceChartProps) {
  if (isLoading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center border border-white/5 rounded-xl bg-zinc-900/50">
        <p className="text-sm text-zinc-500">No sales data available</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.item),
    datasets: [
      {
        data: data.map((d) => d.quantity),
        backgroundColor: (context: { chart: ChartJS; dataIndex: number }) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) {
            return COLORS[context.dataIndex % COLORS.length];
          }
          const base = COLORS[context.dataIndex % COLORS.length];
          return createRadialGradient(ctx, chartArea, base);
        },
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#a1a1aa',
          font: { size: 11 },
          usePointStyle: true,
          padding: 12,
          boxWidth: 8,
        },
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
  };

  return (
    <div className="h-[300px]">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
