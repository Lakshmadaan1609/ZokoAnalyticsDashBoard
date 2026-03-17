'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useQuery } from '@tanstack/react-query';
import { cartService } from '@/services/cartService';
import { CartSalesRecord } from '@/types/apiTypes';
import { formatCurrency, formatDate, getTodayDate } from '@/utils/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { History, Calendar, RefreshCw, Receipt, Banknote, Smartphone } from 'lucide-react';

const CART_LABELS: Record<number, string> = {
  1: 'Cart 1',
  2: 'Cart 2',
  3: 'Cart 3',
};

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [cartFilter, setCartFilter] = useState<number | 'all'>('all');

  const { data: sales = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['sales-by-date', selectedDate],
    queryFn: () => cartService.getSalesByDate(selectedDate),
    staleTime: 30000,
  });

  const filteredSales = cartFilter === 'all'
    ? sales
    : (sales as CartSalesRecord[]).filter((s) => s.cart_id === cartFilter);

  const totals = (sales as CartSalesRecord[]).reduce(
    (acc, s) => {
      acc.orders += 1;
      acc.cash += s.cash_total ?? 0;
      acc.upi += s.upi_total ?? 0;
      return acc;
    },
    { orders: 0, cash: 0, upi: 0 }
  );

  const byCart = [1, 2, 3].map((cartId) => {
    const cartSales = (sales as CartSalesRecord[]).filter((s) => s.cart_id === cartId);
    const cash = cartSales.reduce((sum, s) => sum + (s.cash_total ?? 0), 0);
    const upi = cartSales.reduce((sum, s) => sum + (s.upi_total ?? 0), 0);
    return {
      cartId,
      label: CART_LABELS[cartId] ?? `Cart ${cartId}`,
      orders: cartSales.length,
      cash,
      upi,
      total: cash + upi,
    };
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Sales History
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500 sm:mt-1 sm:text-sm">
              View cart sales by date
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/50 px-3 py-2">
              <Calendar className="h-4 w-4 text-zinc-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm font-medium text-white outline-none [color-scheme:dark]"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="border-white/10 bg-zinc-900/50">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10">
                <Receipt className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Orders
                </p>
                <p className="text-lg font-bold text-white">
                  {isLoading ? '—' : totals.orders}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-zinc-900/50">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10">
                <Banknote className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Cash
                </p>
                <p className="text-lg font-bold text-white">
                  {isLoading ? '—' : formatCurrency(totals.cash)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-zinc-900/50">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
                <Smartphone className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  UPI
                </p>
                <p className="text-lg font-bold text-white">
                  {isLoading ? '—' : formatCurrency(totals.upi)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart-wise summary */}
        <Card className="border-white/10 bg-zinc-900/50">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-base font-semibold text-zinc-200">
              By Cart — {formatDate(selectedDate)}
            </CardTitle>
            <p className="text-xs text-zinc-500">
              Filter the list below by cart or view all
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => setCartFilter('all')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  cartFilter === 'all'
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                All
              </button>
              {byCart.map(({ cartId, label, orders, cash, upi, total }) => (
                <button
                  key={cartId}
                  onClick={() => setCartFilter(cartId)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    cartFilter === cartId
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {label} ({orders})
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {byCart.map(({ cartId, label, orders, cash, upi, total }) => (
                <div
                  key={cartId}
                  className="rounded-xl border border-white/5 bg-zinc-900/70 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    {label}
                  </p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {formatCurrency(total)}
                  </p>
                  <div className="mt-2 flex gap-4 text-xs text-zinc-500">
                    <span>Cash {formatCurrency(cash)}</span>
                    <span>UPI {formatCurrency(upi)}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-600">
                    {orders} order{orders !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sales list */}
        <Card className="border-white/10 bg-zinc-900/50">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-base font-semibold text-zinc-200">
              Sales List
            </CardTitle>
            <p className="text-xs text-zinc-500">
              {cartFilter === 'all'
                ? `All sales on ${formatDate(selectedDate)}`
                : `${CART_LABELS[cartFilter as number]} on ${formatDate(selectedDate)}`}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2">
                <History className="h-8 w-8 text-zinc-700" />
                <p className="text-sm text-zinc-500">No sales for this date</p>
                <p className="text-xs text-zinc-600">
                  Change the date or cart filter
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-zinc-500">Time</TableHead>
                      <TableHead className="text-zinc-500">Cart</TableHead>
                      <TableHead className="text-zinc-500">Cash</TableHead>
                      <TableHead className="text-zinc-500">UPI</TableHead>
                      <TableHead className="text-zinc-500">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(filteredSales as CartSalesRecord[]).map((sale, i) => {
                      const cash = sale.cash_total ?? 0;
                      const upi = sale.upi_total ?? 0;
                      const total = cash + upi;
                      return (
                        <TableRow
                          key={sale.id ?? i}
                          className="border-white/5 transition-colors hover:bg-white/5"
                        >
                          <TableCell className="text-zinc-300">
                            {sale.created_at
                              ? new Date(sale.created_at).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </TableCell>
                          <TableCell className="text-zinc-400">
                            {CART_LABELS[sale.cart_id] ?? `Cart ${sale.cart_id}`}
                          </TableCell>
                          <TableCell className="text-zinc-400">
                            {formatCurrency(cash)}
                          </TableCell>
                          <TableCell className="text-zinc-400">
                            {formatCurrency(upi)}
                          </TableCell>
                          <TableCell className="font-medium text-white">
                            {formatCurrency(total)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
