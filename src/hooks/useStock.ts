'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockService } from '@/services/stockService';
import { getApiErrorMessage } from '@/services/api';
import { DistributionCreate } from '@/types/apiTypes';
import { toast } from 'sonner';

export function useStock() {
  const queryClient = useQueryClient();

  const distributionQuery = useQuery({
    queryKey: ['distribution'],
    queryFn: () => stockService.getAll(),
    staleTime: 30000,
  });

  const distributeMutation = useMutation({
    mutationFn: (data: DistributionCreate) => stockService.submitDistribution(data),
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
