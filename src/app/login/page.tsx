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

    // Invalid credentials
    setError('Invalid username or password');
  };

  if (isAuthenticated) return null;

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/20">
            <span className="text-3xl font-black text-white">Z</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Zoko Momo</h1>
          <p className="mt-1 text-sm text-zinc-500">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-zinc-400">Username</Label>
            <Input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-12 border-white/10 bg-zinc-800/50 text-white placeholder:text-zinc-600 focus:border-orange-500/50"
              placeholder="Enter your username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-400">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 border-white/10 bg-zinc-800/50 text-white placeholder:text-zinc-600 focus:border-orange-500/50"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center font-medium bg-red-500/10 py-2 rounded-lg border border-red-500/20">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full h-12 mt-2 gap-2 font-bold bg-gradient-to-r from-orange-500 to-red-600 text-white hover:opacity-90 shadow-lg shadow-orange-500/20"
          >
            <LogIn className="h-5 w-5" />
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
