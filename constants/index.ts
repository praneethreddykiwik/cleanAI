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
  // 1. Home Cleaning
  {
    id: '1',
    name: 'Kitchen Cleaning',
    slug: 'kitchen-cleaning',
    category: 'Home Cleaning',
    icon: '🍳',
    basePrice: 499,
    description: 'Deep degreasing, chimney scrub, countertop sanitization, and cabinet polishing.',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },
  {
    id: '2',
    name: 'Bathroom Cleaning',
    slug: 'bathroom-cleaning',
    category: 'Home Cleaning',
    icon: '🚿',
    basePrice: 299,
    description: 'Acidic tile scrub, hardwater stain removal, glass shower enclosure sanitization.',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },
  {
    id: '3',
    name: 'Deep Home Cleaning',
    slug: 'deep-cleaning',
    category: 'Home Cleaning',
    icon: '✨',
    basePrice: 1499,
    description: '360° intensive home deep clean covering all rooms, windows, floors, and cobwebs.',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },

  // 2. Pre-Ceremony & Event Cleaning
  {
    id: '13',
    name: 'Griha Pravesh & Wedding Cleaning',
    slug: 'pre-ceremony-cleaning',
    category: 'Pre-Ceremony & Events',
    icon: '🎉',
    basePrice: 1999,
    description: 'Specialized pre-event deep clean, sticker/paint removal, marble shine & kitchen setup.',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },
  {
    id: '14',
    name: 'Post-Renovation Debris Clean',
    slug: 'post-renovation-cleaning',
    category: 'Pre-Ceremony & Events',
    icon: '🏗️',
    basePrice: 2499,
    description: 'Cement dust extraction, paint splash removal, glue/adhesive cleaning, glass polish.',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },

  // 3. Vehicle Care
  {
    id: '11',
    name: 'Premium Bike & Car Wash',
    slug: 'car-wash',
    category: 'Vehicle Care',
    icon: '🚗',
    basePrice: 399,
    description: 'Doorstep foam wash, ceramic spray coating, chain degreasing, and engine bay wash.',
    image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },

  // 4. Repairs & Electrical
  {
    id: '5',
    name: 'Electrical Repairs',
    slug: 'electrical',
    category: 'Repairs & Electrical',
    icon: '⚡',
    basePrice: 399,
    description: 'Certified electricians for wiring, MCB fixes, switch replacement, and appliance setups.',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },
  {
    id: '6',
    name: 'Plumbing Services',
    slug: 'plumbing',
    category: 'Repairs & Electrical',
    icon: '🔧',
    basePrice: 349,
    description: 'Leak detection, blockage clearing, pipe fitting, and sanitaryware installations.',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },
  {
    id: '7',
    name: 'AC Service & Repair',
    slug: 'ac-service',
    category: 'Repairs & Electrical',
    icon: '❄️',
    basePrice: 599,
    description: 'Foam jet AC servicing, gas leak filling, installation, and PCB diagnostics.',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },

  // 5. Home Improvement
  {
    id: '4',
    name: 'Interior & Exterior Painting',
    slug: 'painting',
    category: 'Home Improvement',
    icon: '🎨',
    basePrice: 2999,
    description: 'Wall texture, crack filling, moisture proofing, and premium acrylic painting.',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },

  // 6. Outdoor & Garden
  {
    id: '10',
    name: 'Gardening & Lawn Care',
    slug: 'gardening',
    category: 'Outdoor & Garden',
    icon: '🌿',
    basePrice: 599,
    description: 'Lawn trimming, plant pruning, pressure washing driveways, and terrace garden setups.',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },

  // 7. Pest Control
  {
    id: '8',
    name: 'Herbal Pest Control',
    slug: 'pest-control',
    category: 'Pest Control',
    icon: '🐛',
    basePrice: 799,
    description: 'Odorless cockroach gel treatment, termite drill-fill-seal, and rodent proofing.',
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },

  // 8. Furniture Care
  {
    id: '12',
    name: 'Sofa & Furniture Polish',
    slug: 'sofa-cleaning',
    category: 'Furniture Care',
    icon: '🛋️',
    basePrice: 699,
    description: 'Injection-extraction sofa shampooing, recliner conditioning, and wood polishing.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },

  // 9. Water & Sanitation
  {
    id: '15',
    name: 'Water Tank & Sump Clean',
    slug: 'water-tank-cleaning',
    category: 'Water & Sanitation',
    icon: '💧',
    basePrice: 899,
    description: 'High-pressure sludge extraction, UV sanitization, and antibacterial tank treatment.',
    image: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },

  // 10. Commercial Services
  {
    id: '16',
    name: 'Office & Facility Cleaning',
    slug: 'office-cleaning',
    category: 'Commercial Services',
    icon: '🏢',
    basePrice: 2999,
    description: 'Commercial workstation sanitization, floor scrubbing, glass facade cleaning.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },

  // 11. Moving Services
  {
    id: '17',
    name: 'Move-In / Move-Out Clean',
    slug: 'moving-cleaning',
    category: 'Moving Services',
    icon: '📦',
    basePrice: 1799,
    description: 'Complete handover cleaning for tenants/landlords, sticker removal, and sanitization.',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },

  // 12. Seasonal Services
  {
    id: '18',
    name: 'Festival & Seasonal Deep Clean',
    slug: 'seasonal-cleaning',
    category: 'Seasonal Services',
    icon: '❄️',
    basePrice: 1299,
    description: 'Monsoon mold control, Diwali deep house refresh, and festival preparation cleaning.',
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
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
