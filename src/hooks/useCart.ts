'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '@/services/cartService';
import { getApiErrorMessage } from '@/services/api';
import { CartSalesCreate } from '@/types/apiTypes';
import { toast } from 'sonner';

export function useCart() {
  const queryClient = useQueryClient();

  const saleMutation = useMutation({
    mutationFn: (data: CartSalesCreate) => cartService.updateOrCreateSale(data),
    onSuccess: (_data, variables) => {
      toast.success(`Order placed for Cart ${variables.cart_id}! 🎉`);
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error) || 'Failed to place order');
    },
  });


  return {
    submitOrder: saleMutation.mutate,
    isSubmitting: saleMutation.isPending,
  };
}

export function useCartSales(cartId?: number, date?: string) {
  const query = useQuery({
    queryKey: ['sales', cartId, date],
    queryFn: () => {
      if (!cartId) return Promise.resolve([]);
      // date format expected by API? YYYY-MM-DD
      const dateStr = date || new Date().toISOString().split('T')[0];
      return cartService.getSalesByCartId(cartId, dateStr);
    },
    enabled: !!cartId,
    staleTime: 30000,
  });

  return {
    sales: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useAllLiveSales() {
  const query = useQuery({
    queryKey: ['live-sales-all'],
    queryFn: () => {
      const dateStr = new Date().toISOString().split('T')[0];
      return cartService.getSalesByDate(dateStr);
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });

  return {
    liveSales: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
