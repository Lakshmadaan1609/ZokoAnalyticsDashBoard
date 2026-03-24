'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { useStock } from '@/hooks/useStock';
import { useAuthStore } from '@/store/authStore';
import { useCartSales } from '@/hooks/useCart';
import { DISTRIBUTION_ITEMS, CART_IDS, POS_ITEMS } from '@/utils/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Truck, Loader2, RefreshCw, Package, Calculator, ArrowRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { capitalize, formatDate } from '@/utils/helpers';
import { DistributionRecord, CartSalesRecord, DistributionCreate } from '@/types/apiTypes';
import { toast } from 'sonner';

type DistributionForm = Record<string, Record<number, number>>;

const ITEM_META: Record<string, { icon: string; color: string }> = {
  veg:         { icon: '🥟', color: 'from-green-500/20 to-green-600/10' },
  paneer:      { icon: '🧀', color: 'from-yellow-500/20 to-yellow-600/10' },
  chicken:     { icon: '🍗', color: 'from-red-500/20 to-red-600/10' },
  cheesecorn:  { icon: '🌽', color: 'from-orange-500/20 to-orange-600/10' },
  springroll:  { icon: '🌯', color: 'from-purple-500/20 to-purple-600/10' },
  attaveg:     { icon: '🥬', color: 'from-cyan-500/20 to-cyan-600/10' },
  attachicken: { icon: '🍖', color: 'from-pink-500/20 to-pink-600/10' },
};

const CART_THEME: Record<number, { gradient: string; bg: string; text: string; shadow: string }> = {
  1: { gradient: 'from-orange-500 to-red-600', bg: 'bg-orange-500/10', text: 'text-orange-400', shadow: 'shadow-orange-500/20' },
  2: { gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-500/10', text: 'text-violet-400', shadow: 'shadow-violet-500/20' },
  3: { gradient: 'from-cyan-500 to-teal-600', bg: 'bg-cyan-500/10', text: 'text-cyan-400', shadow: 'shadow-cyan-500/20' },
};

function buildInitialForm(): DistributionForm {
  const initial: DistributionForm = {};
  DISTRIBUTION_ITEMS.forEach((item) => {
    initial[item] = {};
    CART_IDS.forEach((id) => { initial[item][id] = 0; });
  });
  return initial;
}

export default function StockDistributionPage() {
  const { user } = useAuthStore();
  const isStaff = user?.role === 'staff';
  const { distributions, isLoading, isDistributing, distribute, refetch } = useStock();
  const [formData, setFormData] = useState<DistributionForm>(buildInitialForm);
  const [submittingCart, setSubmittingCart] = useState<number | null>(null);

  const { sales } = useCartSales(isStaff ? (user?.cart_id || undefined) : undefined);

  // ── Staff helpers ──
  const getSoldPlates = (category: string) => {
    if (!sales || sales.length === 0) return 0;
    const catItems = POS_ITEMS.filter((i) => i.category === category);
    let totalHalf = 0;
    let totalFull = 0;
    sales.forEach((sale: CartSalesRecord) => {
      catItems.forEach((item) => {
        totalHalf += (sale[item.halfKey as keyof CartSalesRecord] as number) ?? 0;
        totalFull += (sale[item.fullKey as keyof CartSalesRecord] as number) ?? 0;
      });
    });
    return totalFull + totalHalf * 0.5;
  };

  const getTodayAllotted = (item: string) => {
    if (!user?.cart_id) return 0;
    const today = new Date().toDateString();
    return distributions.reduce((sum, d: DistributionRecord) => {
      if (d.cart_id !== user.cart_id) return sum;
      const dDate = d.date ? new Date(d.date).toDateString() : d.created_at ? new Date(d.created_at).toDateString() : '';
      if (dDate !== today) return sum;
      return sum + ((d[item as keyof DistributionRecord] as number) || 0);
    }, 0);
  };

  const displayDistributions = useMemo(
    () => (isStaff ? distributions.filter((d: DistributionRecord) => d.cart_id === user?.cart_id) : distributions),
    [distributions, isStaff, user?.cart_id],
  );

  // ── SuperAdmin helpers ──
  const handleInputChange = (item: string, cartId: number, value: string) => {
    const n = Number.parseInt(value, 10);
    setFormData((prev) => ({
      ...prev,
      [item]: { ...prev[item], [cartId]: Number.isFinite(n) && n > 0 ? n : 0 },
    }));
  };

  const handleDistribute = (cartId: number) => {
    const payload: DistributionCreate = { cart_id: cartId };
    const q = payload as unknown as Record<string, number>;
    for (const item of DISTRIBUTION_ITEMS) {
      const val = Math.trunc(Number(formData[item][cartId] ?? 0));
      if (val > 0) q[item] = val;
    }
    if (!DISTRIBUTION_ITEMS.some((item) => q[item] > 0)) {
      toast.error('Enter at least one quantity before sending.');
      return;
    }
    setSubmittingCart(cartId);
    payload.date = new Date().toISOString().split('T')[0];
    distribute(payload, {
      onSettled: () => {
        setSubmittingCart(null);
        const newForm = { ...formData };
        DISTRIBUTION_ITEMS.forEach((item) => {
          newForm[item] = { ...newForm[item], [cartId]: 0 };
        });
        setFormData(newForm);
      },
    });
  };

  const getItemTotal = (item: string) =>
    CART_IDS.reduce((sum, id) => sum + (formData[item]?.[id] || 0), 0);

  const getCartTotal = (cartId: number) =>
    DISTRIBUTION_ITEMS.reduce((sum, item) => sum + (formData[item]?.[cartId] || 0), 0);

  const grandTotal = CART_IDS.reduce((sum, id) => sum + getCartTotal(id), 0);

  // ═══════════════════════════════════════════════
  // STAFF VIEW
  // ═══════════════════════════════════════════════
  if (isStaff) {
    return (
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Stock Tracker</h1>
              <p className="mt-0.5 text-xs text-zinc-500 sm:mt-1 sm:text-sm">Cart {user?.cart_id} — today's live stock levels</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="w-fit gap-2 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>

          <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
            <CardHeader className="border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                  <Calculator className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base text-zinc-200">Today's Stock Status</CardTitle>
                  <p className="mt-0.5 text-xs text-zinc-500">Allotted vs sold from POS — remaining calculated live</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {DISTRIBUTION_ITEMS.map((item) => {
                  const meta = ITEM_META[item];
                  const allottedKg = getTodayAllotted(item);
                  const allottedPlates = allottedKg * 5;
                  const soldPlates = getSoldPlates(item);
                  const soldKg = soldPlates / 5;
                  const remainingPlates = Math.max(0, allottedPlates - soldPlates);
                  const remainingKg = Math.max(0, allottedKg - soldKg);
                  const pct = allottedPlates > 0 ? Math.min(100, (soldPlates / allottedPlates) * 100) : 0;
                  const isEmpty = remainingPlates === 0 && allottedPlates > 0;

                  return (
                    <div key={item} className={`rounded-xl border border-white/5 bg-gradient-to-br ${meta.color} p-4 transition-all hover:border-white/10`}>
                      <div className="mb-3 flex items-center gap-2.5">
                        <span className="text-2xl">{meta.icon}</span>
                        <span className="text-sm font-semibold text-zinc-200">{capitalize(item)}</span>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isEmpty ? 'bg-red-500' : 'bg-cyan-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Allotted</span>
                          <span className="font-medium text-zinc-300">
                            {allottedPlates.toFixed(0)} plates
                            <span className="ml-1 text-xs text-zinc-500">({allottedKg.toFixed(1)} kg)</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Sold</span>
                          <span className="font-medium text-amber-400">
                            {soldPlates.toFixed(0)} plates
                            <span className="ml-1 text-xs text-zinc-500">({soldKg.toFixed(1)} kg)</span>
                          </span>
                        </div>
                      </div>

                      <div className={`mt-3 flex flex-col gap-0.5 rounded-lg border px-3 py-2 ${isEmpty ? 'border-red-500/20 bg-red-500/5' : 'border-white/5 bg-black/20'}`}>
                        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Remaining</span>
                        <span className={`text-lg font-bold ${isEmpty ? 'text-red-400' : remainingPlates === 0 ? 'text-zinc-600' : 'text-cyan-400'}`}>
                          {remainingPlates.toFixed(0)} plates
                          <span className="ml-1.5 text-xs font-medium opacity-70">({remainingKg.toFixed(1)} kg)</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <HistoryTable records={displayDistributions as DistributionRecord[]} isLoading={isLoading} emptyLabel={`Cart ${user?.cart_id}`} />
        </div>
      </DashboardLayout>
    );
  }

  // ═══════════════════════════════════════════════
  // SUPERADMIN VIEW
  // ═══════════════════════════════════════════════
  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Stock Distribution</h1>
            <p className="mt-0.5 text-xs text-zinc-500 sm:mt-1 sm:text-sm">Distribute manufacturing stock to carts</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="w-fit gap-2 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        {/* Distribution Form */}
        <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
          <CardHeader className="border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base text-zinc-200">Distribute to Carts</CardTitle>
                <p className="mt-0.5 text-xs text-zinc-500">Enter kg quantities per item, per cart</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">

            {/* ── Desktop Table ── */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="w-[180px] text-zinc-500">Item</TableHead>
                    {CART_IDS.map((id) => (
                      <TableHead key={id} className="text-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${CART_THEME[id].bg} ${CART_THEME[id].text}`}>
                          Cart {id}
                        </span>
                      </TableHead>
                    ))}
                    <TableHead className="text-center text-zinc-500">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DISTRIBUTION_ITEMS.map((item) => (
                    <TableRow key={item} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{ITEM_META[item].icon}</span>
                          <div>
                            <span className="text-sm font-medium text-zinc-200">{capitalize(item)}</span>
                            <span className="ml-1.5 text-[10px] text-zinc-600">kg</span>
                          </div>
                        </div>
                      </TableCell>
                      {CART_IDS.map((cartId) => (
                        <TableCell key={cartId} className="text-center">
                          <Input
                            type="number"
                            inputMode="numeric"
                            min="0"
                            value={formData[item]?.[cartId] || ''}
                            onChange={(e) => handleInputChange(item, cartId, e.target.value)}
                            className="mx-auto w-20 border-white/10 bg-zinc-800/50 text-center text-sm font-medium text-white placeholder:text-zinc-600 focus:border-cyan-500/50"
                            placeholder="0"
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <span className={`inline-block min-w-[2.5rem] rounded-lg px-2.5 py-1 text-sm font-bold ${getItemTotal(item) > 0 ? 'bg-cyan-500/10 text-cyan-400' : 'text-zinc-600'}`}>
                          {getItemTotal(item)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* ── Mobile Cards ── */}
            <div className="flex flex-col gap-3 p-3 md:hidden">
              {DISTRIBUTION_ITEMS.map((item) => {
                const meta = ITEM_META[item];
                const total = getItemTotal(item);
                return (
                  <div key={item} className={`rounded-xl border border-white/5 bg-gradient-to-br ${meta.color} p-3.5`}>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{meta.icon}</span>
                        <span className="text-sm font-semibold text-zinc-200">{capitalize(item)}</span>
                      </div>
                      {total > 0 && (
                        <span className="rounded-lg bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-400">{total} kg</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {CART_IDS.map((cartId) => {
                        const theme = CART_THEME[cartId];
                        return (
                          <div key={cartId} className="space-y-1.5">
                            <label className={`block text-center text-[10px] font-semibold uppercase tracking-wider ${theme.text}`}>
                              Cart {cartId}
                            </label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min="0"
                              value={formData[item]?.[cartId] || ''}
                              onChange={(e) => handleInputChange(item, cartId, e.target.value)}
                              className="h-10 border-white/10 bg-black/20 text-center text-base font-semibold text-white placeholder:text-zinc-600 focus:border-cyan-500/50"
                              placeholder="0"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Summary & Submit ── */}
            {grandTotal > 0 && (
              <div className="mx-3 mb-3 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 via-cyan-500/10 to-blue-500/5 p-3 sm:mx-4 sm:mb-4 sm:p-4 md:mt-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15">
                      <Package className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-cyan-400/70">Distribution Summary</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                        {CART_IDS.map((id) => {
                          const ct = getCartTotal(id);
                          return ct > 0 ? (
                            <span key={id} className="flex items-center gap-1">
                              <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${CART_THEME[id].gradient}`} />
                              Cart {id}: <span className="font-semibold text-zinc-200">{ct} kg</span>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-cyan-400">{grandTotal} kg</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-white/5 p-3 sm:flex-row sm:p-4">
              {CART_IDS.map((cartId) => {
                const ct = getCartTotal(cartId);
                const theme = CART_THEME[cartId];
                return (
                  <Button
                    key={cartId}
                    onClick={() => handleDistribute(cartId)}
                    disabled={isDistributing || ct === 0}
                    className={`flex-1 gap-2 bg-gradient-to-r py-5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl sm:py-4 ${theme.gradient} ${theme.shadow} ${ct === 0 ? 'opacity-40' : ''}`}
                  >
                    {submittingCart === cartId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    Cart {cartId} {ct > 0 ? `· ${ct} kg` : ''}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* History */}
        <HistoryTable records={displayDistributions as DistributionRecord[]} isLoading={isLoading} emptyLabel="any cart" />
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════
// History Table
// ═══════════════════════════════════════════════
function HistoryTable({ records, isLoading, emptyLabel }: { records: DistributionRecord[]; isLoading: boolean; emptyLabel: string }) {
  return (
    <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
      <CardHeader className="border-b border-white/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-zinc-200">Distribution History</CardTitle>
          {records.length > 0 && (
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">{records.length} records</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2">
            <Truck className="h-8 w-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">No distribution records yet for {emptyLabel}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-zinc-500">Date</TableHead>
                    <TableHead className="text-zinc-500">Cart</TableHead>
                    {DISTRIBUTION_ITEMS.map((item) => (
                      <TableHead key={item} className="text-zinc-500">{capitalize(item)}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((dist, i) => (
                    <TableRow key={dist.id || i} className="border-white/5 transition-colors hover:bg-white/5">
                      <TableCell className="text-zinc-300">
                        {dist.date ? formatDate(dist.date) : dist.created_at ? formatDate(dist.created_at) : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${CART_THEME[dist.cart_id]?.bg || 'bg-white/5'} ${CART_THEME[dist.cart_id]?.text || 'text-zinc-400'}`}>
                          Cart {dist.cart_id}
                        </span>
                      </TableCell>
                      {DISTRIBUTION_ITEMS.map((item) => {
                        const val = (dist[item as keyof DistributionRecord] as number) || 0;
                        return (
                          <TableCell key={item} className={val > 0 ? 'font-medium text-zinc-300' : 'text-zinc-600'}>
                            {val > 0 ? val : '–'}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-white/5 md:hidden">
              {records.map((dist, i) => {
                const dateStr = dist.date ? formatDate(dist.date) : dist.created_at ? formatDate(dist.created_at) : '-';
                const items = DISTRIBUTION_ITEMS.filter((k) => ((dist[k as keyof DistributionRecord] as number) || 0) > 0);
                return (
                  <div key={dist.id || i} className="px-4 py-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-400">{dateStr}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${CART_THEME[dist.cart_id]?.bg || 'bg-white/5'} ${CART_THEME[dist.cart_id]?.text || 'text-zinc-400'}`}>
                        Cart {dist.cart_id}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {items.length > 0 ? items.map((k) => (
                        <span key={k} className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-xs">
                          <span>{ITEM_META[k]?.icon}</span>
                          <span className="text-zinc-400">{capitalize(k)}</span>
                          <span className="font-semibold text-zinc-200">{(dist[k as keyof DistributionRecord] as number) || 0}</span>
                        </span>
                      )) : (
                        <span className="text-xs text-zinc-600">No items</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
