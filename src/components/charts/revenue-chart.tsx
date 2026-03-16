'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { DailyRevenue } from '@/types/apiTypes';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RevenueChartProps {
  data: DailyRevenue[];
  isLoading?: boolean;
}

const createVerticalGradient = (
  ctx: CanvasRenderingContext2D,
  chartArea: { top: number; bottom: number },
  from: string,
  to: string
) => {
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, from);
  gradient.addColorStop(1, to);
  return gradient;
};

export default function RevenueChart({ data, isLoading }: RevenueChartProps) {
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
        <p className="text-sm text-zinc-500">No revenue data available</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Total Revenue',
        data: data.map((d) => d.total),
        borderColor: (context: { chart: ChartJS }) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return '#f97316';
          return createVerticalGradient(ctx, chartArea, '#f97316', '#fb923c');
        },
        backgroundColor: (context: { chart: ChartJS }) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return 'rgba(249, 115, 22, 0.12)';
          return createVerticalGradient(
            ctx,
            chartArea,
            'rgba(249, 115, 22, 0.24)',
            'rgba(251, 146, 60, 0.02)'
          );
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#f97316',
        pointBorderColor: '#f97316',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#f97316',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Cash',
        data: data.map((d) => d.cash),
        borderColor: (context: { chart: ChartJS }) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return '#22c55e';
          return createVerticalGradient(ctx, chartArea, '#22c55e', '#4ade80');
        },
        backgroundColor: 'rgba(34, 197, 94, 0.05)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        borderDash: [5, 5],
      },
      {
        label: 'UPI',
        data: data.map((d) => d.upi),
        borderColor: (context: { chart: ChartJS }) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return '#8b5cf6';
          return createVerticalGradient(ctx, chartArea, '#8b5cf6', '#a855f7');
        },
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        borderDash: [5, 5],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#a1a1aa',
          font: { size: 12 },
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: '#18181b',
        titleColor: '#f4f4f5',
        bodyColor: '#a1a1aa',
        borderColor: '#27272a',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context: { dataset: { label?: string }; parsed: { y: number | null } }) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ₹${value?.toLocaleString('en-IN')}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#71717a', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#71717a',
          font: { size: 11 },
          callback: (value: string | number) => `₹${Number(value).toLocaleString('en-IN')}`,
        },
      },
    },
  };

  return (
    <div className="h-[300px]">
      <Line data={chartData} options={options} />
    </div>
  );
}
