export interface User {
  id: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  is_approved: boolean;
  created_at: string;
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  unit: 'kg' | 'unidade';
  category?: string;
  created_by: string;
  created_at: string;
  removal_requested?: boolean;
  requested_by?: string;
  requested_at?: string;
}

export interface Withdrawal {
  id: string;
  item_id: string;
  user_id: string;
  quantity: number;
  withdrawn_at: string;
  item?: Item;
  user?: User;
}

export interface DashboardStats {
  totalItems: number;
  totalWithdrawals: number;
  monthlyWithdrawals: number;
  lowStockItems: number;
  outOfStockItems: number;
}