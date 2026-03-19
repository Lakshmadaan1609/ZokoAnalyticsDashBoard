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
import { Truck, Loader2, RefreshCw, Package, Calculator } from 'lucide-react';
import { useState, useEffect } from 'react';
import { capitalize, formatDate } from '@/utils/helpers';
import { DistributionRecord, CartSalesRecord } from '@/types/apiTypes';

type DistributionForm = Record<string, Record<number, number>>;

export default function StockDistributionPage() {
  const { user } = useAuthStore();
  const isStaff = user?.role === 'staff';
  const { distributions, isLoading, isDistributing, distribute, refetch } = useStock();
  const [formData, setFormData] = useState<DistributionForm>(() => {
    const initial: DistributionForm = {};
    DISTRIBUTION_ITEMS.forEach((item) => {
      initial[item] = {};
      CART_IDS.forEach((cartId) => {
        initial[item][cartId] = 0;
      });
    });
    return initial;
  });

  const [submittingCart, setSubmittingCart] = useState<number | null>(null);

  // Auto-tracker via Cart Sales for Staff
  const { sales } = useCartSales(isStaff ? (user?.cart_id || undefined) : undefined);

  const getSoldPlates = (category: string) => {
    if (!sales || sales.length === 0) return 0;
    
    const catItems = POS_ITEMS.filter((i) => i.category === category);
    let totalHalf = 0;
    let totalFull = 0;

    sales.forEach((sale) => {
      catItems.forEach((item) => {
        totalHalf += ((sale as any)[item.halfKey] as number) || 0;
        totalFull += ((sale as any)[item.fullKey] as number) || 0;
      });
    });

    return totalFull + (totalHalf * 0.5);
  };

  const getTodayAllotted = (item: string) => {
    if (!user?.cart_id) return 0;
    const today = new Date().toDateString();
    return distributions.reduce((sum, d: DistributionRecord) => {
      if (d.cart_id !== user.cart_id) return sum;
      const dDate = d.date ? new Date(d.date).toDateString() : (d.created_at ? new Date(d.created_at).toDateString() : '');
      if (dDate !== today) return sum;
      return sum + ((d[item as keyof DistributionRecord] as number) || 0);
    }, 0);
  };

  // Safe distribution history filtered for staff
  const displayDistributions = isStaff 
    ? distributions.filter((d: DistributionRecord) => d.cart_id === user?.cart_id)
    : distributions;

  const handleInputChange = (item: string, cartId: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData((prev) => ({
      ...prev,
      [item]: { ...prev[item], [cartId]: numValue },
    }));
  };

  const handleDistribute = async (cartId: number) => {
    setSubmittingCart(cartId);
    const todayYmd = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    const payload: Record<string, number | string | undefined> = { cart_id: cartId, date: todayYmd };
    DISTRIBUTION_ITEMS.forEach((item) => {
      const val = formData[item][cartId];
      if (val > 0) {
        payload[item] = val;
      }
    });

    distribute(payload as never, {
      onSettled: () => {
        setSubmittingCart(null);
        // Reset form for this cart
        const newForm = { ...formData };
        DISTRIBUTION_ITEMS.forEach((item) => {
          newForm[item] = { ...newForm[item], [cartId]: 0 };
        });
        setFormData(newForm);
      },
    });
  };

  const getItemTotal = (item: string) => {
    return CART_IDS.reduce((sum, cartId) => sum + (formData[item]?.[cartId] || 0), 0);
  };

  const ITEM_ICONS: Record<string, string> = {
    veg: '🥟',
    paneer: '🧀',
    chicken: '🍗',
    cheesecorn: '🌽',
    springroll: '🌯',
    attaveg: '🥬',
    attachicken: '🍖',
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Stock Distribution
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500 sm:mt-1 sm:text-sm">
              Distribute manufacturing stock to carts
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

        {/* Staff Manual Tracker OR SuperAdmin Distribute Form */}
        {isStaff ? (
          <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
            <CardHeader className="border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                  <Calculator className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base text-zinc-200">
                    Today's Cart Stock Tracker
                  </CardTitle>
                  <p className="text-xs text-zinc-500">
                    Manually track remaining stock by entering POS sales quantities
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {DISTRIBUTION_ITEMS.map((item) => {
                  const allottedKg = getTodayAllotted(item);
                  const allottedPlates = allottedKg * 5; 
                  
                  const soldPlates = getSoldPlates(item);
                  const soldKg = soldPlates / 5;

                  const remainingPlates = Math.max(0, allottedPlates - soldPlates);
                  const remainingKg = Math.max(0, allottedKg - soldKg);

                  return (
                    <div key={item} className="rounded-xl border border-white/5 bg-zinc-800/20 p-4 transition-colors hover:bg-white/[0.02]">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="text-2xl">{ITEM_ICONS[item] || '📦'}</span>
                        <span className="font-semibold text-zinc-200">{capitalize(item)}</span>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-500">Allotted Today</span>
                          <span className="font-medium text-zinc-300">{allottedPlates.toFixed(1)} plates <span className="text-zinc-500 text-xs text-opacity-70">({allottedKg.toFixed(1)} kg)</span></span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-500">POS Sales</span>
                          <span className="font-medium text-orange-400">{soldPlates.toFixed(1)} plates <span className="text-zinc-500 text-xs text-opacity-70">({soldKg.toFixed(1)} kg)</span></span>
                        </div>
                        
                        <div className="flex flex-col gap-1 rounded-lg bg-black/20 px-3 py-2 border border-white/5 mt-2">
                          <span className="text-zinc-400 text-xs uppercase tracking-widest font-medium">Remaining Live Stock</span>
                          <div className={`text-lg font-bold ${remainingPlates === 0 && allottedPlates > 0 ? 'text-red-400' : remainingPlates === 0 ? 'text-zinc-500' : 'text-cyan-400'}`}>
                            {remainingPlates.toFixed(1)} plates <span className="text-sm font-medium opacity-80">({remainingKg.toFixed(1)} kg)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
          <CardHeader className="border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base text-zinc-200">
                  Distribute to Carts
                </CardTitle>
                <p className="text-xs text-zinc-500">
                  Enter distribution quantities per cart
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="w-[200px] text-zinc-500">Item</TableHead>
                    {CART_IDS.map((id) => (
                      <TableHead key={id} className="text-center text-zinc-500">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-medium">Cart {id}</span>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center text-zinc-500">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DISTRIBUTION_ITEMS.map((item) => (
                    <TableRow key={item} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{ITEM_ICONS[item] || '📦'}</span>
                          <span className="text-sm font-medium text-zinc-300">
                            {capitalize(item)}
                          </span>
                        </div>
                      </TableCell>
                      {CART_IDS.map((cartId) => (
                        <TableCell key={cartId} className="text-center">
                          <Input
                            type="number"
                            min="0"
                            value={formData[item]?.[cartId] || ''}
                            onChange={(e) => handleInputChange(item, cartId, e.target.value)}
                            className="mx-auto w-20 border-white/10 bg-zinc-800/50 text-center text-white placeholder:text-zinc-600 focus:border-orange-500/50"
                            placeholder="0"
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <span className="rounded-lg bg-orange-500/10 px-3 py-1 text-sm font-bold text-orange-400">
                          {getItemTotal(item)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards Layout */}
            <div className="md:hidden flex flex-col gap-3 p-3">
              {DISTRIBUTION_ITEMS.map((item) => (
                <div key={item} className="rounded-xl border border-white/5 bg-zinc-800/20 p-3.5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{ITEM_ICONS[item] || '📦'}</span>
                      <span className="text-sm font-semibold text-zinc-200">
                        {capitalize(item)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-500 uppercase">Total:</span>
                      <span className="rounded-md bg-orange-500/10 px-2 py-0.5 text-xs font-bold text-orange-400">
                        {getItemTotal(item)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {CART_IDS.map((cartId) => (
                      <div key={cartId} className="space-y-1">
                        <label className="text-[10px] uppercase text-zinc-500">Cart {cartId}</label>
                        <Input
                          type="number"
                          min="0"
                          value={formData[item]?.[cartId] || ''}
                          onChange={(e) => handleInputChange(item, cartId, e.target.value)}
                          className="h-9 border-white/10 bg-zinc-900/50 text-center text-white placeholder:text-zinc-600 focus:border-orange-500/50"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row border-t border-white/5 p-4">
              {CART_IDS.map((cartId) => (
                <Button
                  key={cartId}
                  onClick={() => handleDistribute(cartId)}
                  disabled={isDistributing}
                  className="flex-1 gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                >
                  {submittingCart === cartId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                  Send to Cart {cartId}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Distribution History */}
        <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-base text-zinc-200">
              Distribution History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
              </div>
            ) : displayDistributions.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2">
                <Truck className="h-8 w-8 text-zinc-700" />
                <p className="text-sm text-zinc-500">No distribution records yet for {isStaff ? `Cart ${user?.cart_id}` : 'any cart'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-zinc-500">Date</TableHead>
                      <TableHead className="text-zinc-500">Cart</TableHead>
                      <TableHead className="text-zinc-500">Veg</TableHead>
                      <TableHead className="text-zinc-500">Paneer</TableHead>
                      <TableHead className="text-zinc-500">Chicken</TableHead>
                      <TableHead className="text-zinc-500">Cheese Corn</TableHead>
                      <TableHead className="text-zinc-500">Spring Roll</TableHead>
                      <TableHead className="text-zinc-500">Atta Veg</TableHead>
                      <TableHead className="text-zinc-500">Atta Chicken</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(displayDistributions as DistributionRecord[]).map((dist, i) => (
                      <TableRow
                        key={dist.id || i}
                        className="border-white/5 transition-colors hover:bg-white/5"
                      >
                        <TableCell className="text-zinc-300">
                          {dist.date ? formatDate(dist.date) : dist.created_at ? formatDate(dist.created_at) : '-'}
                        </TableCell>
                        <TableCell>
                          <span className="rounded-lg bg-cyan-500/10 px-2 py-0.5 text-xs font-bold text-cyan-400">
                            Cart {dist.cart_id}
                          </span>
                        </TableCell>
                        <TableCell className="text-zinc-400">{dist.veg || 0}</TableCell>
                        <TableCell className="text-zinc-400">{dist.paneer || 0}</TableCell>
                        <TableCell className="text-zinc-400">{dist.chicken || 0}</TableCell>
                        <TableCell className="text-zinc-400">{dist.cheesecorn || 0}</TableCell>
                        <TableCell className="text-zinc-400">{dist.springroll || 0}</TableCell>
                        <TableCell className="text-zinc-400">{dist.attaveg || 0}</TableCell>
                        <TableCell className="text-zinc-400">{dist.attachicken || 0}</TableCell>
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
