import axios, { AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  AuthResponse, 
  LoginCredentials, 
  RegisterData, 
  User, 
  Group, 
  Expense, 
  CreateExpenseData,
  Settlement 
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: RegisterData): Promise<ApiResponse<AuthResponse>> =>
    api.post('/api/auth/register', data).then(res => res.data),
  
  login: (data: LoginCredentials): Promise<ApiResponse<AuthResponse>> =>
    api.post('/api/auth/login', data).then(res => res.data),
  
  getProfile: (): Promise<ApiResponse<{ user: User }>> =>
    api.get('/api/auth/me').then(res => res.data),
  
  updateProfile: (data: Partial<User>): Promise<ApiResponse<{ user: User }>> =>
    api.put('/api/auth/profile', data).then(res => res.data),
};

// Groups API
export const groupsAPI = {
  getGroups: (): Promise<ApiResponse<{ groups: Group[]; count: number }>> =>
    api.get('/api/groups').then(res => res.data),
  
  getGroup: (id: string): Promise<ApiResponse<{ group: Group; expenses: Expense[] }>> =>
    api.get(`/api/groups/${id}`).then(res => res.data),
  
  createGroup: (data: { name: string; description?: string; members?: string[] }): Promise<ApiResponse<{ group: Group }>> =>
    api.post('/api/groups', data).then(res => res.data),
  
  updateGroup: (id: string, data: { name?: string; description?: string; avatar?: string }): Promise<ApiResponse<{ group: Group }>> =>
    api.put(`/api/groups/${id}`, data).then(res => res.data),
  
  addMember: (id: string, email: string): Promise<ApiResponse<{ group: Group }>> =>
    api.post(`/api/groups/${id}/members`, { email }).then(res => res.data),
  
  removeMember: (id: string, memberId: string): Promise<ApiResponse<any>> =>
    api.delete(`/api/groups/${id}/members/${memberId}`).then(res => res.data),
};

// Expenses API
export const expensesAPI = {
  getExpenses: (params?: { 
    group?: string; 
    category?: string; 
    limit?: number; 
    page?: number; 
  }): Promise<ApiResponse<{ 
    expenses: Expense[]; 
    pagination: {
      currentPage: number;
      totalPages: number;
      totalExpenses: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>> =>
    api.get('/api/expenses', { params }).then(res => res.data),
  
  getExpense: (id: string): Promise<ApiResponse<{ expense: Expense }>> =>
    api.get(`/api/expenses/${id}`).then(res => res.data),
  
  createExpense: (data: CreateExpenseData): Promise<ApiResponse<{ expense: Expense }>> =>
    api.post('/api/expenses', data).then(res => res.data),
  
  updateExpense: (id: string, data: Partial<CreateExpenseData>): Promise<ApiResponse<{ expense: Expense }>> =>
    api.put(`/api/expenses/${id}`, data).then(res => res.data),
  
  deleteExpense: (id: string): Promise<ApiResponse<any>> =>
    api.delete(`/api/expenses/${id}`).then(res => res.data),
  
  getCategories: (): Promise<ApiResponse<{ categories: string[] }>> =>
    api.get('/api/expenses/categories').then(res => res.data),
};

// Settlements API
export const settlementsAPI = {
  getBalances: (group?: string): Promise<ApiResponse<any>> =>
    api.get('/api/settlements/balances', { params: { group } }).then(res => res.data),
  
  getSettlements: (params?: { group?: string }): Promise<ApiResponse<{ settlements: Settlement[] }>> =>
    api.get('/api/settlements', { params }).then(res => res.data),
  
  createSettlement: (data: {
    from: string;
    to: string;
    amount: number;
    description?: string;
    group?: string;
    payment_method?: string;
    payment_reference?: string;
    notes?: string;
  }): Promise<ApiResponse<{ settlement: Settlement }>> =>
    api.post('/api/settlements', data).then(res => res.data),
};

// Health check
export const healthAPI = {
  check: (): Promise<ApiResponse<any>> =>
    api.get('/health').then(res => res.data),
};

export default api;