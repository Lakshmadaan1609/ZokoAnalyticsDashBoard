'use client';

import { create } from 'zustand';
import { OrderItem, POSItem } from '@/types/apiTypes';

interface PerCartState {
  items: OrderItem[];
  cashAmount: string;
  upiAmount: string;
}

interface CartState {
  carts: Record<number, PerCartState>;
  activeCartId: number;
  setActiveCart: (cartId: number) => void;
  addHalf: (cartId: number, item: POSItem) => void;
  addFull: (cartId: number, item: POSItem) => void;
  removeHalf: (cartId: number, itemId: string) => void;
  removeFull: (cartId: number, itemId: string) => void;
  clearCart: (cartId: number) => void;
  setCashAmount: (cartId: number, amount: string) => void;
  setUpiAmount: (cartId: number, amount: string) => void;
  getTotal: (cartId: number) => number;
  getItemCount: (cartId: number) => number;
  getCart: (cartId: number) => PerCartState;
}

const emptyCart = (): PerCartState => ({ items: [], cashAmount: '', upiAmount: '' });

export const useCartStore = create<CartState>((set, get) => ({
  carts: {
    1: emptyCart(),
    2: emptyCart(),
    3: emptyCart(),
  },
  activeCartId: 1,

  setActiveCart: (cartId: number) => set({ activeCartId: cartId }),

  getCart: (cartId: number) => get().carts[cartId] || emptyCart(),

  addHalf: (cartId: number, item: POSItem) => {
    set((state) => {
      const cart = state.carts[cartId] || emptyCart();
      const existing = cart.items.find((i) => i.item.id === item.id);
      const updatedItems = existing
        ? cart.items.map((i) => (i.item.id === item.id ? { ...i, halfQty: i.halfQty + 1 } : i))
        : [...cart.items, { item, halfQty: 1, fullQty: 0 }];
      return { carts: { ...state.carts, [cartId]: { ...cart, items: updatedItems } } };
    });
  },

  addFull: (cartId: number, item: POSItem) => {
    set((state) => {
      const cart = state.carts[cartId] || emptyCart();
      const existing = cart.items.find((i) => i.item.id === item.id);
      const updatedItems = existing
        ? cart.items.map((i) => (i.item.id === item.id ? { ...i, fullQty: i.fullQty + 1 } : i))
        : [...cart.items, { item, halfQty: 0, fullQty: 1 }];
      return { carts: { ...state.carts, [cartId]: { ...cart, items: updatedItems } } };
    });
  },

  removeHalf: (cartId: number, itemId: string) => {
    set((state) => {
      const cart = state.carts[cartId] || emptyCart();
      const updatedItems = cart.items
        .map((i) => (i.item.id === itemId ? { ...i, halfQty: Math.max(0, i.halfQty - 1) } : i))
        .filter((i) => i.halfQty > 0 || i.fullQty > 0);
      return { carts: { ...state.carts, [cartId]: { ...cart, items: updatedItems } } };
    });
  },

  removeFull: (cartId: number, itemId: string) => {
    set((state) => {
      const cart = state.carts[cartId] || emptyCart();
      const updatedItems = cart.items
        .map((i) => (i.item.id === itemId ? { ...i, fullQty: Math.max(0, i.fullQty - 1) } : i))
        .filter((i) => i.halfQty > 0 || i.fullQty > 0);
      return { carts: { ...state.carts, [cartId]: { ...cart, items: updatedItems } } };
    });
  },

  clearCart: (cartId: number) => {
    set((state) => ({
      carts: { ...state.carts, [cartId]: emptyCart() },
    }));
  },

  setCashAmount: (cartId: number, amount: string) => {
    set((state) => {
      const cart = state.carts[cartId] || emptyCart();
      return { carts: { ...state.carts, [cartId]: { ...cart, cashAmount: amount } } };
    });
  },

  setUpiAmount: (cartId: number, amount: string) => {
    set((state) => {
      const cart = state.carts[cartId] || emptyCart();
      return { carts: { ...state.carts, [cartId]: { ...cart, upiAmount: amount } } };
    });
  },

  getTotal: (cartId: number) => {
    const cart = get().carts[cartId] || emptyCart();
    return cart.items.reduce(
      (total, { item, halfQty, fullQty }) => total + item.halfPrice * halfQty + item.fullPrice * fullQty,
      0
    );
  },

  getItemCount: (cartId: number) => {
    const cart = get().carts[cartId] || emptyCart();
    return cart.items.reduce((count, { halfQty, fullQty }) => count + halfQty + fullQty, 0);
  },
}));
