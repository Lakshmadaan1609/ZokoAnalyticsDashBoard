'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ROLE_ROUTES } from '@/utils/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from '@/types/apiTypes';
import { LogIn } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

export default function LoginPage() {
  const { login, isAuthenticated, user, checkSession } = useAuthStore();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const route = ROLE_ROUTES[user.role] || '/dashboard';
      router.push(route);
    }
  }, [isAuthenticated, user, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUser = username.trim().toLowerCase();

    // Super Admin: Laksh / 1609
    if (trimmedUser === 'laksh' && password === '1609') {
      const adminUser: User = {
        user_id: 1,
        role: 'superadmin',
        cart_id: null,
        name: 'Laksh (Super Admin)',
      };
      login(adminUser);
      return;
    }

    // Staff Cart 1: c1 / 1111 (Nikesh)
    if (trimmedUser === 'c1' && password === '1111') {
      login({ user_id: 2, role: 'staff', cart_id: 1, name: 'Nikesh' });
      return;
    }

    // Staff Cart 2: c2 / 2222 (Bharat)
    if (trimmedUser === 'c2' && password === '2222') {
      login({ user_id: 3, role: 'staff', cart_id: 2, name: 'Bharat' });
      return;
    }

    // Staff Cart 3: c3 / 3333 (Jai)
    if (trimmedUser === 'c3' && password === '3333') {
      login({ user_id: 4, role: 'staff', cart_id: 3, name: 'Jai' });
      return;
    }

    setError('Invalid username or password');
  };

  if (isAuthenticated) return null;

  return (
    <div className="flex min-h-[100dvh] min-h-screen items-center justify-center bg-black px-4 py-6 sm:p-6">
      <div className="flex w-full max-w-[400px] flex-col">
        <div className="w-full rounded-2xl border border-[#d4af37]/20 bg-zinc-900/80 p-5 shadow-xl shadow-black/40 backdrop-blur-sm sm:p-7">
          <div className="mb-6 flex flex-col items-center sm:mb-7">
            <BrandLogo className="h-20 w-20 sm:h-24 sm:w-24" priority />
            <h1 className="mt-2 text-center text-lg font-bold tracking-tight text-[#d4af37] sm:text-xl">
              Zoko Momo
            </h1>
            <p className="mt-0.5 text-center text-xs text-zinc-500 sm:text-sm">
              Operations · Sign in to your account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-zinc-400">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="min-h-[48px] border-zinc-700 bg-zinc-800/80 text-white placeholder:text-zinc-500 focus:border-[#d4af37]/50 focus:ring-[#d4af37]/20 sm:min-h-[52px]"
                placeholder="Enter your username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-400">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-[48px] border-zinc-700 bg-zinc-800/80 text-white placeholder:text-zinc-500 focus:border-[#d4af37]/50 focus:ring-[#d4af37]/20 sm:min-h-[52px]"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 py-2.5 text-center text-sm font-medium text-red-400">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="min-h-[48px] w-full gap-2 rounded-xl bg-[#d4af37] font-bold text-black shadow-lg shadow-[#d4af37]/25 transition hover:bg-[#c9a227] active:scale-[0.98] sm:min-h-[52px]"
            >
              <LogIn className="h-5 w-5" />
              Sign In
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-zinc-600">
          Zoko Momo · Operations Dashboard
        </p>
      </div>
    </div>
  );
}
