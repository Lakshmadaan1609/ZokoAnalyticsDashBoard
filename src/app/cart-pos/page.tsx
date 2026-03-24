'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useCart } from '@/hooks/useCart';
import { POS_ITEMS, ITEM_CATEGORIES } from '@/utils/constants';
import { formatCurrency } from '@/utils/helpers';
import { CartSalesCreate, POSItem } from '@/types/apiTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Loader2,
  Receipt,
  ChevronUp,
  X,
} from 'lucide-react';
import { useState, useMemo } from 'react';

const CARTS = [
  { id: 1, label: 'Cart 1', color: 'from-orange-500 to-red-600', accent: 'orange' },
  { id: 2, label: 'Cart 2', color: 'from-violet-500 to-purple-600', accent: 'violet' },
  { id: 3, label: 'Cart 3', color: 'from-cyan-500 to-teal-600', accent: 'cyan' },
];

const accentStyles = {
  orange: {
    activeCat: 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/20',
    itemActive: 'border-orange-500/30 bg-orange-500/5 shadow-lg shadow-orange-500/10',
    badge: 'bg-orange-500 text-white',
    plusBtn: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30',
    checkoutBtn: 'bg-gradient-to-r from-orange-500 to-red-600 shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30',
    headerIcon: 'bg-gradient-to-br from-orange-500 to-red-600',
    priceColor: 'text-orange-400',
    fab: 'from-orange-500 to-red-600 shadow-orange-500/30',
  },
  violet: {
    activeCat: 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20',
    itemActive: 'border-violet-500/30 bg-violet-500/5 shadow-lg shadow-violet-500/10',
    badge: 'bg-violet-500 text-white',
    plusBtn: 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30',
    checkoutBtn: 'bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30',
    headerIcon: 'bg-gradient-to-br from-violet-500 to-purple-600',
    priceColor: 'text-violet-400',
    fab: 'from-violet-500 to-purple-600 shadow-violet-500/30',
  },
  cyan: {
    activeCat: 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-500/20',
    itemActive: 'border-cyan-500/30 bg-cyan-500/5 shadow-lg shadow-cyan-500/10',
    badge: 'bg-cyan-500 text-white',
    plusBtn: 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30',
    checkoutBtn: 'bg-gradient-to-r from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30',
    headerIcon: 'bg-gradient-to-br from-cyan-500 to-teal-600',
    priceColor: 'text-cyan-400',
    fab: 'from-cyan-500 to-teal-600 shadow-cyan-500/30',
  },
};

export default function CartPOSPage() {
  const store = useCartStore();
  const { user } = useAuthStore();
  const { submitOrder, isSubmitting } = useCart();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('upi');

  const availableCarts = useMemo(() => {
    if (user?.role === 'staff' && user.cart_id) {
      return CARTS.filter((c) => c.id === user.cart_id);
    }
    return CARTS;
  }, [user]);

  // Ensure active cart is valid for the user
  const initialCartId = availableCarts.find(c => c.id === store.activeCartId)?.id || availableCarts[0]?.id || 1;
  const activeCartId = initialCartId;

  const activeCartConfig = CARTS.find((c) => c.id === activeCartId) || CARTS[0];
  const cart = store.getCart(activeCartId);
  const accent = accentStyles[activeCartConfig.accent as keyof typeof accentStyles];

  // Cart 1: exclude fried chicken and kurkure chicken; all other carts show full menu
  const itemsForCart = useMemo(() => {
    if (activeCartId !== 1) return POS_ITEMS;
    return POS_ITEMS.filter(
      (item) => item.id !== 'chickenfried' && item.id !== 'chickenkurkure'
    );
  }, [activeCartId]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return itemsForCart;
    return itemsForCart.filter((item) => item.category === activeCategory);
  }, [activeCategory, itemsForCart]);

  const handleCheckout = () => {
    const today = new Date().toISOString().split('T')[0];
    const orderData: CartSalesCreate = { cart_id: activeCartId, date: today };
    for (const orderItem of cart.items) {
      const halfKey = orderItem.item.halfKey as keyof CartSalesCreate;
      const fullKey = orderItem.item.fullKey as keyof CartSalesCreate;
      if (orderItem.halfQty > 0) (orderData[halfKey] as number) = orderItem.halfQty;
      if (orderItem.fullQty > 0) (orderData[fullKey] as number) = orderItem.fullQty;
    }
    const total = store.getTotal(activeCartId);
    orderData.cash_total = paymentMethod === 'cash' ? total : 0;
    orderData.upi_total = paymentMethod === 'upi' ? total : 0;
    submitOrder(orderData);
    store.clearCart(activeCartId);
    setMobileCartOpen(false);
  };

  const getItemQty = (item: POSItem) => {
    const found = cart.items.find((i) => i.item.id === item.id);
    return { half: found?.halfQty || 0, full: found?.fullQty || 0 };
  };

  // ── Order Summary Panel (shared between desktop sidebar & mobile bottom sheet) ──
  const OrderSummaryContent = () => (
    <>
      <div className="flex items-center justify-between border-b border-white/5 p-4">
        <div className="flex items-center gap-2">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent.headerIcon}`}>
            <ShoppingCart className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-base font-semibold text-zinc-200">{activeCartConfig.label}</p>
            <p className="text-xs text-zinc-500">{store.getItemCount(activeCartId)} items • {formatCurrency(store.getTotal(activeCartId))}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {cart.items.length > 0 && (
            <button onClick={() => store.clearCart(activeCartId)} className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => setMobileCartOpen(false)} className="rounded-lg p-2 text-zinc-500 hover:bg-white/10 hover:text-white xl:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {cart.items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-8">
            <Receipt className="h-12 w-12 text-zinc-700" />
            <p className="text-sm text-zinc-500">No items added yet</p>
            <p className="text-xs text-zinc-600">Tap items from the menu to add</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.items.map((orderItem) => (
              <div key={orderItem.item.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-200">{orderItem.item.name}</p>
                  <div className="mt-0.5 flex gap-3 text-xs text-zinc-500">
                    {orderItem.halfQty > 0 && <span>Half × {orderItem.halfQty}</span>}
                    {orderItem.fullQty > 0 && <span>Full × {orderItem.fullQty}</span>}
                  </div>
                </div>
                <p className={`ml-3 text-sm font-bold ${accent.priceColor}`}>
                  {formatCurrency(orderItem.item.halfPrice * orderItem.halfQty + orderItem.item.fullPrice * orderItem.fullQty)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {cart.items.length > 0 && (
        <div className="border-t border-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Total</span>
            <span className="text-xl font-bold text-white">{formatCurrency(store.getTotal(activeCartId))}</span>
          </div>
          <Separator className="mb-3 bg-white/5" />
          <div className="mb-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all ${
                paymentMethod === 'cash'
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : 'border-white/10 bg-zinc-800/50 text-zinc-400 hover:border-white/20 hover:text-white'
              }`}
            >
              <Banknote className="h-4 w-4" /> Cash
            </button>
            <button
              onClick={() => setPaymentMethod('upi')}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all ${
                paymentMethod === 'upi'
                  ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                  : 'border-white/10 bg-zinc-800/50 text-zinc-400 hover:border-white/20 hover:text-white'
              }`}
            >
              <CreditCard className="h-4 w-4" /> UPI
            </button>
          </div>
          <Button onClick={handleCheckout} disabled={isSubmitting || cart.items.length === 0} className={`w-full gap-2 py-5 text-sm font-semibold text-white ${accent.checkoutBtn}`}>
            {isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" />Processing...</>) : (<><Receipt className="h-4 w-4" />Place Order • {formatCurrency(store.getTotal(activeCartId))}</>)}
          </Button>
        </div>
      )}
    </>
  );

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-5rem)] w-full min-w-0 flex-col gap-3 sm:h-[calc(100vh-7rem)] sm:gap-4">
        {/* Cart Selector Tabs */}
        <div className="flex w-full min-w-0 items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {availableCarts.map((c) => {
            const itemCount = store.getItemCount(c.id);
            const isActive = c.id === activeCartId;
            const cartState = store.getCart(c.id);
            return (
              <button
                key={c.id}
                onClick={() => store.setActiveCart(c.id)}
                className={`relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 sm:gap-2.5 sm:px-5 sm:py-3 ${
                  isActive
                    ? `bg-gradient-to-r ${c.color} text-white shadow-lg`
                    : 'border border-white/10 bg-zinc-900/50 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                {c.label}
                {itemCount > 0 && (
                  <span className={`flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-zinc-300'}`}>
                    {itemCount}
                  </span>
                )}
                {cartState.items.length > 0 && !isActive && (
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-zinc-950" />
                )}
              </button>
            );
          })}
        </div>

        {/* POS Content */}
        <div className="flex w-full min-w-0 flex-1 gap-4 overflow-hidden">
          {/* Left Panel — Menu */}
          <div className="flex w-full min-w-0 flex-1 flex-col overflow-hidden">
            {/* Categories */}
            <div className="mb-3 flex w-full items-center gap-2 overflow-x-auto pb-2 no-scrollbar sm:mb-4">
              <button
                onClick={() => setActiveCategory('all')}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all sm:px-4 ${
                  activeCategory === 'all' ? accent.activeCat : 'border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                All
              </button>
              {ITEM_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all sm:px-4 ${
                    activeCategory === cat.id ? accent.activeCat : 'border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Item Grid */}
            <div className="flex-1 w-full min-w-0 overflow-y-auto overflow-x-hidden pb-20 xl:pb-0">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredItems.map((item) => {
                  const qty = getItemQty(item);
                  const isItemActive = qty.half > 0 || qty.full > 0;
                  return (
                    <Card key={item.id} className={`group overflow-hidden border transition-all duration-200 ${isItemActive ? accent.itemActive : 'border-white/10 bg-zinc-900/50 hover:border-white/20'}`}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="mb-2 flex items-start justify-between sm:mb-3">
                          <div>
                            <h3 className="mt-1 text-xs font-semibold leading-tight text-zinc-200 sm:text-sm">{item.name}</h3>
                          </div>
                          {isItemActive && <Badge className={`${accent.badge} text-[10px]`}>{qty.half + qty.full}</Badge>}
                        </div>

                        {/* Half */}
                        <div className="mb-1.5 flex items-center justify-between rounded-lg border border-white/5 bg-zinc-800/30 px-2 py-1.5 sm:mb-2 sm:py-1.5">
                          <div>
                            <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-500 sm:text-[10px]">Half</p>
                            <p className="text-[11px] font-bold text-zinc-300 sm:text-xs">{formatCurrency(item.halfPrice)}</p>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-1.5">
                            <button type="button" onClick={() => store.removeHalf(activeCartId, item.id)} className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-zinc-700/50 text-zinc-400 transition-colors hover:bg-red-500/20 hover:text-red-400 active:scale-95 sm:h-7 sm:w-7 sm:min-h-0 sm:min-w-0">
                              <Minus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-white sm:w-6 sm:text-sm">{qty.half}</span>
                            <button type="button" onClick={() => store.addHalf(activeCartId, item)} className={`flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-colors active:scale-95 sm:h-7 sm:w-7 sm:min-h-0 sm:min-w-0 ${accent.plusBtn}`}>
                              <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Full */}
                        <div className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-800/30 px-2 py-1.5 sm:py-1.5">
                          <div>
                            <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-500 sm:text-[10px]">Full</p>
                            <p className="text-[11px] font-bold text-zinc-300 sm:text-xs">{formatCurrency(item.fullPrice)}</p>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-1.5">
                            <button type="button" onClick={() => store.removeFull(activeCartId, item.id)} className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-zinc-700/50 text-zinc-400 transition-colors hover:bg-red-500/20 hover:text-red-400 active:scale-95 sm:h-7 sm:w-7 sm:min-h-0 sm:min-w-0">
                              <Minus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-white sm:w-6 sm:text-sm">{qty.full}</span>
                            <button type="button" onClick={() => store.addFull(activeCartId, item)} className={`flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-colors active:scale-95 sm:h-7 sm:w-7 sm:min-h-0 sm:min-w-0 ${accent.plusBtn}`}>
                              <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel — Desktop Order Summary */}
          <div className="hidden w-[380px] shrink-0 xl:block">
            <Card className="flex h-full flex-col border-white/10 bg-zinc-900/50 backdrop-blur-sm">
              <OrderSummaryContent />
            </Card>
          </div>
        </div>

        {/* ── Mobile Floating Cart Button ── */}
        {store.getItemCount(activeCartId) > 0 && (
          <button
            onClick={() => setMobileCartOpen(true)}
            className={`fixed bottom-6 right-4 z-30 flex items-center gap-2 rounded-2xl bg-gradient-to-r px-5 py-3.5 text-sm font-semibold text-white shadow-xl transition-transform active:scale-95 xl:hidden ${accent.fab}`}
          >
            <ShoppingCart className="h-5 w-5" />
            <span>{store.getItemCount(activeCartId)} items</span>
            <span className="mx-1 text-white/40">|</span>
            <span>{formatCurrency(store.getTotal(activeCartId))}</span>
            <ChevronUp className="ml-1 h-4 w-4" />
          </button>
        )}

        {/* ── Mobile Bottom Sheet ── */}
        {mobileCartOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm xl:hidden" onClick={() => setMobileCartOpen(false)} />
            <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-3xl border-t border-white/10 bg-zinc-950 xl:hidden">
              {/* Drag handle */}
              <div className="flex justify-center py-2">
                <div className="h-1 w-10 rounded-full bg-zinc-700" />
              </div>
              <OrderSummaryContent />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
