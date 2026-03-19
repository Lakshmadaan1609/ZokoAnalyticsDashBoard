'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockService } from '@/services/stockService';
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
    onSuccess: () => {
      toast.success('Stock distributed successfully!');
      queryClient.invalidateQueries({ queryKey: ['distribution'] });
    },
    onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
      toast.error(error.response?.data?.detail || 'Failed to distribute stock');
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
