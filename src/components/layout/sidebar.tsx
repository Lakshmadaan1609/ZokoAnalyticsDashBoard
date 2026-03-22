'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { NAV_ITEMS } from '@/utils/constants';
import {
  LayoutDashboard,
  Factory,
  Truck,
  ShoppingCart,
  History,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Factory, Truck, ShoppingCart, History, BarChart3, Settings,
};

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [collapsed, setCollapsed] = useState(false);

  const filteredNav = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onMobileClose} />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen border-r border-white/10 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'
        } w-[280px] ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/20">
                <span className="text-lg font-bold text-white">Z</span>
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white">Zoko Momo</h1>
                <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Operations</p>
              </div>
            </div>
          )}
          {collapsed && (
            <BrandLogo className="mx-auto h-9 w-9 shrink-0" priority />
          )}
          <button onClick={onMobileClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-4 flex flex-col gap-1 px-3">
          {filteredNav.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500/15 to-red-500/10 text-orange-400 shadow-lg shadow-orange-500/5'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-orange-400 to-red-500" />
                )}
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-orange-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                {!collapsed && <span>{item.label}</span>}
                {collapsed && <span className="lg:hidden">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white lg:flex"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {/* Bottom */}
        {!collapsed && (
          <div className="absolute bottom-4 left-3 right-3">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20">
                  <span className="text-xs font-bold text-orange-400">{user?.role?.charAt(0).toUpperCase() || 'U'}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-200">{user?.name || user?.role || 'User'}</p>
                  <p className="truncate text-xs capitalize text-zinc-500">{user?.role?.replace('_', ' ') || 'Role'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
