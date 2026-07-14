// ============================================================
// Shared Types — Clean AI Platform
// Used across frontend and backend
// ============================================================

// ==================
// User & Auth Types
// ==================

export type UserRole = 'CUSTOMER' | 'VENDOR' | 'AGENT' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

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

// ==================
// Customer Types
// ==================

export interface Customer {
  id: string;
  userId: string;
  user: User;
  addresses: Address[];
  bookings: Booking[];
  profileCompletionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

// ==================
// Vendor Types
// ==================

export type VendorStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface Vendor {
  id: string;
  userId: string;
  user: User;
  businessName: string;
  businessDescription?: string;
  gstNumber?: string;
  panNumber?: string;
  status: VendorStatus;
  rating: number;
  totalJobs: number;
  agents: Agent[];
  services: VendorService[];
  documents: Document[];
  createdAt: string;
  updatedAt: string;
}

// ==================
// Agent Types
// ==================

export type AgentStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export interface Agent {
  id: string;
  userId: string;
  user: User;
  vendorId: string;
  vendor: Vendor;
  status: AgentStatus;
  rating: number;
  totalJobs: number;
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

// ==================
// Service Types
// ==================

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  image: string;
  basePrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorService {
  id: string;
  vendorId: string;
  serviceId: string;
  service: Service;
  price: number;
  isActive: boolean;
}

// ==================
// Booking Types
// ==================

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'VENDOR_ACCEPTED'
  | 'AGENT_ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  customer: Customer;
  serviceId: string;
  service: Service;
  vendorId?: string;
  vendor?: Vendor;
  agentId?: string;
  agent?: Agent;
  addressId: string;
  address: Address;
  scheduledDate: string;
  scheduledTime: string;
  status: BookingStatus;
  notes?: string;
  totalAmount: number;
  platformFee: number;
  vendorAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  serviceId: string;
  addressId: string;
  scheduledDate: string;
  scheduledTime: string;
  notes?: string;
}

// ==================
// Address Types
// ==================

export interface Address {
  id: string;
  customerId: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================
// Notification Types
// ==================

export type NotificationType = 'BOOKING' | 'PAYMENT' | 'SYSTEM' | 'PROMOTION';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

// ==================
// API Response Types
// ==================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode: number;
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

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ==================
// Analytics Types
// ==================

export interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  totalUsers: number;
  totalVendors: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  growthRate: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
}

// ==================
// Document Types
// ==================

export interface Document {
  id: string;
  vendorId: string;
  type: 'GST' | 'PAN' | 'AADHAAR' | 'LICENSE' | 'INSURANCE' | 'OTHER';
  name: string;
  url: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}
