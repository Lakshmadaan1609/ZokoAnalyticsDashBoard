// ==================== AUTH ====================
export interface LoginRequest {
  pin: string;
}

export interface LoginResponse {
  user_id: number;
  role: 'superadmin' | 'staff';
  cart_id: number | null;
  name?: string;
}

export interface User {
  user_id: number;
  role: 'superadmin' | 'staff';
  cart_id: number | null;
  name?: string;
  loginDate?: string;
}

// ==================== MANUFACTURING ====================
export interface ManufacturingCreate {
  veg?: number | null;
  paneer?: number | null;
  chicken?: number | null;
  cheesecorn?: number | null;
  springroll?: number | null;
  attaveg?: number | null;
  attachicken?: number | null;
  chilli_sauce?: string | null;
  special_sause?: string | null;
  total_bill?: number | null;
  date?: string | null;
}

export interface ManufacturingRecord extends ManufacturingCreate {
  id?: number;
  created_at?: string;
}

// ==================== DISTRIBUTION ====================
export interface DistributionCreate {
  cart_id: number;
  veg?: number | null;
  paneer?: number | null;
  chicken?: number | null;
  cheesecorn?: number | null;
  springroll?: number | null;
  attaveg?: number | null;
  attachicken?: number | null;
  date?: string | null;
}

export interface DistributionRecord extends DistributionCreate {
  id?: number;
  created_at?: string;
}

// ==================== CART SALES ====================
export interface CartSalesCreate {
  cart_id: number;
  /** Business date YYYY-MM-DD; sent on POST/PUT when API supports it */
  date?: string | null;
  half_vegsteam?: number | null;
  full_vegsteam?: number | null;
  half_vegfried?: number | null;
  full_vegfried?: number | null;
  half_vegkurkure?: number | null;
  full_vegkurkure?: number | null;
  half_paneersteam?: number | null;
  full_paneersteam?: number | null;
  half_paneerfried?: number | null;
  full_paneerfried?: number | null;
  half_paneerkurkure?: number | null;
  full_paneerkurkure?: number | null;
  half_chickensteam?: number | null;
  full_chickensteam?: number | null;
  half_chickenfried?: number | null;
  full_chickenfried?: number | null;
  half_chickenkurkure?: number | null;
  full_chickenkurkure?: number | null;
  half_cheesecornsteam?: number | null;
  full_cheesecorsteamn?: number | null;
  half_cheesecornfried?: number | null;
  full_cheesecornfried?: number | null;
  half_cheesecornkurkure?: number | null;
  full_cheesecornkurkure?: number | null;
  half_springroll?: number | null;
  full_springroll?: number | null;
  half_springrollkurkure?: number | null;
  full_springrollkurkure?: number | null;
  half_attavegsteam?: number | null;
  full_attavegsteam?: number | null;
  half_attachickensteam?: number | null;
  full_attachickensteam?: number | null;
  cash_total?: number | null;
  upi_total?: number | null;
  Shift_timing?: number | null;
  created_at?: string | null;
}

export interface CartSalesRecord extends CartSalesCreate {
  id?: number;
}

// ==================== POS TYPES ====================
export interface POSItem {
  id: string;
  name: string;
  category: 'veg' | 'paneer' | 'chicken' | 'cheesecorn' | 'springroll' | 'attaveg' | 'attachicken';
  type: 'steam' | 'fried' | 'kurkure';
  halfKey: string;
  fullKey: string;
  halfPrice: number;
  fullPrice: number;
  icon: string;
}

export interface OrderItem {
  item: POSItem;
  halfQty: number;
  fullQty: number;
}

// ==================== ANALYTICS ====================
export interface DailyRevenue {
  date: string;
  total: number;
  cash: number;
  upi: number;
}

export interface CartPerformance {
  cart_id: number;
  total_revenue: number;
  total_orders: number;
  cash_total: number;
  upi_total: number;
}

export interface ItemSales {
  item: string;
  quantity: number;
}
