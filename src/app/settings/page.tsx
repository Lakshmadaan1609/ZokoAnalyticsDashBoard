'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Palette,
  Globe,
  Database,
  ArrowRight,
} from 'lucide-react';

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  const settingSections = [
    {
      icon: User,
      title: 'Profile Settings',
      description: 'Manage your account details and preferences',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      icon: Shield,
      title: 'Security',
      description: 'Change PIN and manage access controls',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Configure alert and notification preferences',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      icon: Palette,
      title: 'Appearance',
      description: 'Customize the dashboard look and feel',
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      icon: Globe,
      title: 'Language & Region',
      description: 'Set your language and regional preferences',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    {
      icon: Database,
      title: 'Data Management',
      description: 'Export data and manage backups',
      color: 'text-brand-400',
      bg: 'bg-brand-500/10',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Settings
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500 sm:mt-1 sm:text-sm">
            Manage your dashboard preferences and configuration
          </p>
        </div>

        {/* User Info Card */}
        <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/20 sm:h-14 sm:w-14">
                <User className="h-6 w-6 text-white sm:h-7 sm:w-7" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-white sm:text-lg">
                  {user?.name || `User #${user?.user_id}`}
                </h2>
                <div className="mt-1 flex items-center gap-2">
                  <Badge className="bg-orange-500/10 text-orange-400 capitalize">
                    {user?.role?.replace('_', ' ')}
                  </Badge>
                  {user?.cart_id && (
                    <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                      Cart {user.cart_id}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-fit border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 sm:ml-auto"
            >
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        <Separator className="bg-white/5" />

        {/* Settings Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {settingSections.map((section) => (
            <Card
              key={section.title}
              className="group cursor-pointer border-white/10 bg-zinc-900/50 transition-all duration-200 hover:border-white/20 hover:shadow-lg"
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${section.bg}`}>
                  <section.icon className={`h-6 w-6 ${section.color}`} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-sm font-semibold text-zinc-200">
                    {section.title}
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {section.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-1 group-hover:text-zinc-400" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* App Info */}
        <Card className="border-white/10 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-300">
              <SettingsIcon className="h-4 w-4 text-zinc-500" />
              Application Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <p className="text-zinc-500">Version</p>
                <p className="font-medium text-zinc-300">1.0.0</p>
              </div>
              <div>
                <p className="text-zinc-500">Environment</p>
                <p className="font-medium text-zinc-300">Production</p>
              </div>
              <div>
                <p className="text-zinc-500">API</p>
                <p className="font-medium text-zinc-300 truncate">posbackendfastapi.vercel.app</p>
              </div>
              <div>
                <p className="text-zinc-500">Framework</p>
                <p className="font-medium text-zinc-300">Next.js 14</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
