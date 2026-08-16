// ==================
// Core User Types
// ==================
export type UserRole = 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'AGENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
export type VendorStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type AgentStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';
export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'VENDOR_ACCEPTED'
  | 'AGENT_ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';

// ==================
// User
// ==================
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: any;
  vendor?: any;
}

// ==================
// Address
// ==================
export interface Address {
  id: string;
  customerId: string;
  label: 'Home' | 'Office' | 'Other';
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
}

// ==================
// Service
// ==================
export interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  icon: string;
  basePrice: number;
  description: string;
  image: string;
  isActive: boolean;
  duration?: number;
}

// ==================
// Vendor
// ==================
export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  description?: string;
  gstNumber?: string;
  panNumber?: string;
  status: VendorStatus;
  rating?: number;
  totalJobs?: number;
  coverageArea?: string[];
  serviceIds?: string[];
  bankAccountNumber?: string;
  ifscCode?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

// ==================
// Agent
// ==================
export interface Agent {
  id: string;
  userId: string;
  vendorId: string;
  status: AgentStatus;
  skills?: string[];
  rating?: number;
  totalJobs?: number;
  isVerified: boolean;
  aadhaarNumber?: string;
  panNumber?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  vendor?: Vendor;
}

// ==================
// Booking
// ==================
export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  vendorId?: string;
  agentId?: string;
  serviceId?: string;
  addressId?: string;
  status: BookingStatus;
  scheduledDate: string;
  scheduledTime: string;
  completedAt?: string;
  serviceCharge: number;
  platformFee: number;
  totalAmount: number;
  customerNotes?: string;
  adminNotes?: string;
  otp?: string;
  otpVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Joined relations
  customer?: User;
  vendor?: Vendor;
  agent?: Agent;
  service?: Service;
  address?: Address;
  payment?: Payment;
  reviews?: Review[];
}

// ==================
// Payment
// ==================
export interface Payment {
  id: string;
  bookingId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string;
  gateway?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  paidAt?: string;
  failureReason?: string;
  createdAt: string;
}

// ==================
// Review
// ==================
export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  vendorId?: string;
  agentId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
  customer?: User;
}

// ==================
// Notification
// ==================
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// ==================
// API Response Types
// ==================
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ==================
// Auth Types
// ==================
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ==================
// Navigation
// ==================
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
  children?: NavItem[];
}

// ==================
// Filter Types
// ==================
export interface BookingFilters {
  status?: BookingStatus;
  dateFrom?: string;
  dateTo?: string;
  serviceId?: string;
  vendorId?: string;
  agentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface VendorFilters {
  status?: VendorStatus;
  search?: string;
  city?: string;
  serviceId?: string;
  page?: number;
  limit?: number;
}

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}

// ==================
// Dashboard Data
// ==================
export interface CustomerDashboardData {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  totalSpent: number;
  recentBookings: Booking[];
  upcomingBookingsList: Booking[];
}

export interface VendorDashboardData {
  incomingJobs: number;
  todayJobs: number;
  monthRevenue: number;
  activeAgents: number;
  totalJobsCompleted: number;
  rating: number;
  acceptanceRate: number;
}

export interface AdminDashboardData {
  totalUsers: number;
  activeVendors: number;
  totalBookings: number;
  platformRevenue: number;
  completionRate: number;
  pendingApprovals: number;
  avgResponseTime: number;
  platformHealth: number;
}

// ==================
// Component Props
// ==================
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}
