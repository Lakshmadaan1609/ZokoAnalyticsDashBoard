'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { manufacturingService } from '@/services/manufacturingService';
import { getApiErrorMessage } from '@/services/api';
import { ManufacturingCreate } from '@/types/apiTypes';
import { toast } from 'sonner';

export function useManufacturing() {
  const queryClient = useQueryClient();

  const logsQuery = useQuery({
    queryKey: ['manufacturing-logs'],
    queryFn: () => manufacturingService.getAll(),
    staleTime: 30000,
  });

  const dispatchMutation = useMutation({
    mutationFn: (data: ManufacturingCreate) => manufacturingService.updateOrCreate(data),
    onSuccess: () => {
      toast.success('Manufacturing dispatch recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['manufacturing-logs'] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error) || 'Failed to record dispatch');
    },
  });

  return {
    logs: logsQuery.data || [],
    isLoading: logsQuery.isLoading,
    isError: logsQuery.isError,
    refetch: logsQuery.refetch,
    dispatch: dispatchMutation.mutate,
    isDispatching: dispatchMutation.isPending,
  };
}
