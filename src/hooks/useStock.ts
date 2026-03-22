'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockService } from '@/services/stockService';
import { getApiErrorMessage } from '@/services/api';
import { DistributionCreate } from '@/types/apiTypes';
import { toast } from 'sonner';

/**
 * If a distribution row already exists for today + cart_id → PUT (add values).
 * Otherwise → POST (create new row).
 * If the lookup itself fails (404 / network), fall back to POST.
 */
async function smartDistribute(data: DistributionCreate) {
  const today = new Date().toISOString().split('T')[0];
  try {
    const existing = await stockService.getByCartId(data.cart_id, today);
    if (existing.length > 0) {
      return stockService.updateOrCreate(data);
    }
  } catch {
    // lookup failed — safe to fall through to POST
  }
  return stockService.distribute(data);
}

export function useStock() {
  const queryClient = useQueryClient();

  const distributionQuery = useQuery({
    queryKey: ['distribution'],
    queryFn: () => stockService.getAll(),
    staleTime: 30000,
  });

  const distributeMutation = useMutation({
    mutationFn: smartDistribute,
    onSuccess: (_data, variables) => {
      toast.success(`Stock distributed to Cart ${variables.cart_id}!`);
      queryClient.invalidateQueries({ queryKey: ['distribution'] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error) || 'Failed to distribute stock');
    },
  });

  return {
    distributions: distributionQuery.data || [],
    isLoading: distributionQuery.isLoading,
    isError: distributionQuery.isError,
    refetch: distributionQuery.refetch,
    distribute: distributeMutation.mutate,
    isDistributing: distributeMutation.isPending,
  };
}
