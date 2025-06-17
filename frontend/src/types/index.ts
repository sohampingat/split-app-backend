// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  totalBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// Group Types
export interface GroupMember {
  user: User;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  members: GroupMember[];
  createdBy: User;
  totalExpenses: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Expense Types
export interface ExpenseSplit {
  person: User;
  person_name: string;
  share: number;
  settled: boolean;
  settled_at?: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  paid_by: User;
  paid_by_name: string;
  group?: Group;
  splits: ExpenseSplit[];
  split_type: 'equal' | 'exact' | 'percentage';
  currency: string;
  receipt_url?: string;
  tags: string[];
  notes: string;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseData {
  amount: number;
  description: string;
  category?: string;
  paid_by?: string;
  group?: string;
  split_among: string[];
  split_type?: 'equal' | 'exact' | 'percentage';
  splits?: { person: string; share: number }[];
  notes?: string;
  tags?: string[];
}

// Settlement Types
export interface Settlement {
  id: string;
  from: User;
  to: User;
  amount: number;
  description: string;
  group?: Group;
  expenses: string[];
  payment_method: 'cash' | 'bank_transfer' | 'upi' | 'card' | 'other';
  payment_reference: string;
  status: 'pending' | 'completed' | 'cancelled';
  settled_at: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Balance Types
export interface Balance {
  person: string;
  amount: number;
  type: 'owes' | 'owed';
}

export interface GroupBalance {
  [personName: string]: Balance[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  errors?: any[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Component Props Types
export interface ExpenseFormProps {
  onSubmit: (expense: CreateExpenseData) => void;
  onCancel: () => void;
  initialData?: Partial<CreateExpenseData>;
  group?: Group;
}

export interface ExpenseListProps {
  expenses: Expense[];
  onEdit?: (expense: Expense) => void;
  onDelete?: (expenseId: string) => void;
}

export interface BalanceDisplayProps {
  balances: GroupBalance;
  currentUserId: string;
}