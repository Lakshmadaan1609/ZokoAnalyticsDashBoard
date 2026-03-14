'use client';

import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { useRouter } from 'next/navigation';
import { ROLE_ROUTES } from '@/utils/constants';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useAuth() {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: (pin: string) => authService.login(pin),
    onSuccess: (data) => {
      login(data);
      const route = ROLE_ROUTES[data.role] || '/dashboard';
      toast.success(`Welcome! Redirecting to ${data.role} dashboard...`);
      router.push(route);
    },
    onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
      toast.error(error.response?.data?.detail || 'Invalid PIN. Please try again.');
    },
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
    toast.success('Logged out successfully');
  };

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    logout: handleLogout,
    isLoading: loginMutation.isPending,
    error: loginMutation.error,
  };
}
