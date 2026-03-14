import { POSItem } from '@/types/apiTypes';

export const APP_NAME = 'Zoko Momo';

export const ROLES = {
  SUPERADMIN: 'superadmin',
  STAFF: 'staff',
} as const;

export const ROLE_ROUTES: Record<string, string> = {
  superadmin: '/dashboard',
  staff: '/cart-pos',
};

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', roles: ['superadmin'], icon: 'LayoutDashboard' },
  { label: 'Manufacturing', href: '/manufacturing', roles: ['superadmin'], icon: 'Factory' },
  { label: 'Stock Distribution', href: '/stock-distribution', roles: ['superadmin', 'staff'], icon: 'Truck' },
  { label: 'Cart POS', href: '/cart-pos', roles: ['superadmin', 'staff'], icon: 'ShoppingCart' },
  { label: 'Analytics', href: '/analytics', roles: ['superadmin'], icon: 'BarChart3' },
  { label: 'Settings', href: '/settings', roles: ['superadmin'], icon: 'Settings' },
];

export const DISTRIBUTION_ITEMS = ['veg', 'paneer', 'chicken', 'cheesecorn', 'springroll', 'attaveg', 'attachicken'] as const;

export const CART_IDS = [1, 2, 3] as const;

export const POS_ITEMS: POSItem[] = [
  // STEAM MOMOS
  { id: 'vegsteam', name: 'Veg Steam Momos', category: 'veg', type: 'steam', halfKey: 'half_vegsteam', fullKey: 'full_vegsteam', halfPrice: 50, fullPrice: 80, icon: '🥟' },
  { id: 'paneersteam', name: 'Paneer Steam Momos', category: 'paneer', type: 'steam', halfKey: 'half_paneersteam', fullKey: 'full_paneersteam', halfPrice: 60, fullPrice: 100, icon: '🧀' },
  { id: 'chickensteam', name: 'Chicken Steam Momos', category: 'chicken', type: 'steam', halfKey: 'half_chickensteam', fullKey: 'full_chickensteam', halfPrice: 60, fullPrice: 100, icon: '🍗' },
  { id: 'attavegsteam', name: 'Atta Veg Steam', category: 'attaveg', type: 'steam', halfKey: 'half_attavegsteam', fullKey: 'full_attavegsteam', halfPrice: 60, fullPrice: 100, icon: '🥬' },
  { id: 'attachickensteam', name: 'Atta Chicken Steam', category: 'attachicken', type: 'steam', halfKey: 'half_attachickensteam', fullKey: 'full_attachickensteam', halfPrice: 70, fullPrice: 120, icon: '🍖' },

  // FRIED MOMOS
  { id: 'vegfried', name: 'Veg Fried Momos', category: 'veg', type: 'fried', halfKey: 'half_vegfried', fullKey: 'full_vegfried', halfPrice: 60, fullPrice: 100, icon: '🍳' },
  { id: 'paneerfried', name: 'Paneer Fried Momos', category: 'paneer', type: 'fried', halfKey: 'half_paneerfried', fullKey: 'full_paneerfried', halfPrice: 70, fullPrice: 120, icon: '🧀' },
  { id: 'chickenfried', name: 'Chicken Fried Momos', category: 'chicken', type: 'fried', halfKey: 'half_chickenfried', fullKey: 'full_chickenfried', halfPrice: 70, fullPrice: 120, icon: '🍗' },
  { id: 'cheesecornfried', name: 'Cheese Corn Fried', category: 'cheesecorn', type: 'fried', halfKey: 'half_cheesecornfried', fullKey: 'full_cheesecornfried', halfPrice: 80, fullPrice: 150, icon: '🌽' },

  // KURKURE MOMOS
  { id: 'vegkurkure', name: 'Veg Kurkure Momos', category: 'veg', type: 'kurkure', halfKey: 'half_vegkurkure', fullKey: 'full_vegkurkure', halfPrice: 70, fullPrice: 140, icon: '🌶️' },
  { id: 'paneerkurkure', name: 'Paneer Kurkure Momos', category: 'paneer', type: 'kurkure', halfKey: 'half_paneerkurkure', fullKey: 'full_paneerkurkure', halfPrice: 80, fullPrice: 160, icon: '🧀' },
  { id: 'chickenkurkure', name: 'Chicken Kurkure Momos', category: 'chicken', type: 'kurkure', halfKey: 'half_chickenkurkure', fullKey: 'full_chickenkurkure', halfPrice: 80, fullPrice: 160, icon: '🍗' },
  { id: 'cheesecornkurkure', name: 'Cheese Corn Kurkure', category: 'cheesecorn', type: 'kurkure', halfKey: 'half_cheesecornkurkure', fullKey: 'full_cheesecornkurkure', halfPrice: 90, fullPrice: 170, icon: '🌽' },
];

export const ITEM_CATEGORIES = [
  { id: 'veg', label: 'Veg', color: '#22c55e' },
  { id: 'paneer', label: 'Paneer', color: '#eab308' },
  { id: 'chicken', label: 'Chicken', color: '#ef4444' },
  { id: 'cheesecorn', label: 'Cheese Corn', color: '#f97316' },
  { id: 'attaveg', label: 'Atta Veg', color: '#06b6d4' },
  { id: 'attachicken', label: 'Atta Chicken', color: '#ec4899' },
];
