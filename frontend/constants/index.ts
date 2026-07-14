export const APP_NAME = 'Clean AI';
export const APP_DESCRIPTION = 'AI-Powered Home Services Marketplace';
export const APP_VERSION = '1.0.0';

export const ROUTES = {
  HOME: '/',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    VERIFY_OTP: '/auth/verify-otp',
  },
  CUSTOMER: {
    DASHBOARD: '/customer/dashboard',
    SERVICES: '/customer/services',
    BOOKINGS: '/customer/bookings',
    BOOK: '/customer/booking',
    PROFILE: '/customer/profile',
    NOTIFICATIONS: '/customer/notifications',
  },
  VENDOR: {
    DASHBOARD: '/vendor/dashboard',
    JOBS: '/vendor/jobs',
    AGENTS: '/vendor/agents',
    PROFILE: '/vendor/profile',
    PRICING: '/vendor/pricing',
    DOCUMENTS: '/vendor/documents',
    ANALYTICS: '/vendor/analytics',
    NOTIFICATIONS: '/vendor/notifications',
    SETTINGS: '/vendor/settings',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    VENDORS: '/admin/vendors',
    BOOKINGS: '/admin/bookings',
    AGENTS: '/admin/agents',
    SETTINGS: '/admin/settings',
    ANALYTICS: '/admin/analytics',
    REPORTS: '/admin/reports',
    SUPPORT: '/admin/support',
  },
} as const;

export const SERVICES_DATA = [
  {
    id: '1',
    name: 'Kitchen Cleaning',
    slug: 'kitchen-cleaning',
    category: 'Cleaning',
    icon: '🍳',
    basePrice: 499,
    description:
      'Professional deep cleaning for your kitchen, including appliances, countertops, and cabinets.',
    image: '/images/services/kitchen-cleaning.jpg',
    isActive: true,
  },
  {
    id: '2',
    name: 'Bathroom Cleaning',
    slug: 'bathroom-cleaning',
    category: 'Cleaning',
    icon: '🚿',
    basePrice: 299,
    description:
      'Thorough sanitization and cleaning of bathrooms, tiles, and fixtures.',
    image: '/images/services/bathroom-cleaning.jpg',
    isActive: true,
  },
  {
    id: '3',
    name: 'Deep Cleaning',
    slug: 'deep-cleaning',
    category: 'Cleaning',
    icon: '✨',
    basePrice: 1499,
    description:
      'Complete home deep cleaning service covering every corner of your space.',
    image: '/images/services/deep-cleaning.jpg',
    isActive: true,
  },
  {
    id: '4',
    name: 'Painting',
    slug: 'painting',
    category: 'Home Improvement',
    icon: '🎨',
    basePrice: 2999,
    description:
      'Professional interior and exterior painting services for your home.',
    image: '/images/services/painting.jpg',
    isActive: true,
  },
  {
    id: '5',
    name: 'Electrical',
    slug: 'electrical',
    category: 'Repair',
    icon: '⚡',
    basePrice: 399,
    description:
      'Expert electricians for repairs, installations, and safety inspections.',
    image: '/images/services/electrical.jpg',
    isActive: true,
  },
  {
    id: '6',
    name: 'Plumbing',
    slug: 'plumbing',
    category: 'Repair',
    icon: '🔧',
    basePrice: 349,
    description:
      'Fix leaks, blockages, and plumbing installations by certified plumbers.',
    image: '/images/services/plumbing.jpg',
    isActive: true,
  },
  {
    id: '7',
    name: 'AC Service',
    slug: 'ac-service',
    category: 'Appliance',
    icon: '❄️',
    basePrice: 599,
    description:
      'AC servicing, deep cleaning, gas refill, and repair services.',
    image: '/images/services/ac-service.jpg',
    isActive: true,
  },
  {
    id: '8',
    name: 'Pest Control',
    slug: 'pest-control',
    category: 'Home Care',
    icon: '🐛',
    basePrice: 799,
    description:
      'Professional pest control treatments for cockroaches, ants, rodents, and more.',
    image: '/images/services/pest-control.jpg',
    isActive: true,
  },
  {
    id: '9',
    name: 'Laundry',
    slug: 'laundry',
    category: 'Home Care',
    icon: '👕',
    basePrice: 249,
    description:
      'Wash, dry, fold, and iron services for all your clothing and linens.',
    image: '/images/services/laundry.jpg',
    isActive: true,
  },
  {
    id: '10',
    name: 'Gardening',
    slug: 'gardening',
    category: 'Outdoor',
    icon: '🌿',
    basePrice: 599,
    description:
      'Garden maintenance, pruning, planting, and lawn care services.',
    image: '/images/services/gardening.jpg',
    isActive: true,
  },
  {
    id: '11',
    name: 'Car Wash',
    slug: 'car-wash',
    category: 'Vehicle',
    icon: '🚗',
    basePrice: 399,
    description:
      'Doorstep car washing, interior cleaning, and detailing services.',
    image: '/images/services/car-wash.jpg',
    isActive: true,
  },
  {
    id: '12',
    name: 'Sofa Cleaning',
    slug: 'sofa-cleaning',
    category: 'Cleaning',
    icon: '🛋️',
    basePrice: 699,
    description:
      'Professional sofa and upholstery cleaning to remove stains and odors.',
    image: '/images/services/sofa-cleaning.jpg',
    isActive: true,
  },
] as const;

export const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
] as const;

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  VENDOR_ACCEPTED: 'Vendor Accepted',
  AGENT_ASSIGNED: 'Agent Assigned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DISPUTED: 'Disputed',
};

export const VENDOR_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SUSPENDED: 'Suspended',
};

export const AGENT_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Available',
  BUSY: 'Busy',
  OFFLINE: 'Offline',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  REFUNDED: 'Refunded',
  FAILED: 'Failed',
};

export const SERVICE_CATEGORIES = [
  'All',
  'Cleaning',
  'Home Improvement',
  'Repair',
  'Appliance',
  'Home Care',
  'Outdoor',
  'Vehicle',
] as const;

export const PAGINATION_LIMIT = 10;
export const PLATFORM_FEE_PERCENTAGE = 10; // 10%

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh',
] as const;

export const ADDRESS_LABELS = ['Home', 'Office', 'Other'] as const;

export const BOOKING_TIMELINE = [
  { key: 'PENDING', label: 'Booking Placed', icon: '📋' },
  { key: 'CONFIRMED', label: 'Confirmed', icon: '✅' },
  { key: 'VENDOR_ACCEPTED', label: 'Vendor Accepted', icon: '🏪' },
  { key: 'AGENT_ASSIGNED', label: 'Agent Assigned', icon: '👷' },
  { key: 'IN_PROGRESS', label: 'Work In Progress', icon: '🔨' },
  { key: 'COMPLETED', label: 'Completed', icon: '🎉' },
] as const;
