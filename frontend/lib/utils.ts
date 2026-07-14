import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(
  date: string | Date,
  format: 'short' | 'long' | 'relative' = 'short'
): string {
  const d = new Date(date);
  if (format === 'relative') {
    const now = Date.now();
    const diff = now - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
  }
  return d.toLocaleDateString('en-IN', {
    ...(format === 'long'
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric' }),
  });
}

export function formatTime(time: string): string {
  const [hoursStr, minutes] = time.split(':');
  const hours = parseInt(hoursStr);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '…';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'text-amber-700 bg-amber-50 border-amber-200',
    CONFIRMED: 'text-blue-700 bg-blue-50 border-blue-200',
    VENDOR_ACCEPTED: 'text-purple-700 bg-purple-50 border-purple-200',
    AGENT_ASSIGNED: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    IN_PROGRESS: 'text-orange-700 bg-orange-50 border-orange-200',
    COMPLETED: 'text-green-700 bg-green-50 border-green-200',
    CANCELLED: 'text-red-700 bg-red-50 border-red-200',
    DISPUTED: 'text-red-800 bg-red-100 border-red-300',
    APPROVED: 'text-green-700 bg-green-50 border-green-200',
    REJECTED: 'text-red-700 bg-red-50 border-red-200',
    SUSPENDED: 'text-orange-700 bg-orange-50 border-orange-200',
    AVAILABLE: 'text-green-700 bg-green-50 border-green-200',
    BUSY: 'text-amber-700 bg-amber-50 border-amber-200',
    OFFLINE: 'text-gray-600 bg-gray-50 border-gray-200',
    PAID: 'text-green-700 bg-green-50 border-green-200',
    REFUNDED: 'text-blue-700 bg-blue-50 border-blue-200',
    FAILED: 'text-red-700 bg-red-50 border-red-200',
    VERIFIED: 'text-green-700 bg-green-50 border-green-200',
    ACTIVE: 'text-green-700 bg-green-50 border-green-200',
    INACTIVE: 'text-gray-600 bg-gray-50 border-gray-200',
  };
  return colors[status] || 'text-gray-600 bg-gray-50 border-gray-200';
}

export function getStatusDotColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: 'bg-green-500',
    BUSY: 'bg-amber-500',
    OFFLINE: 'bg-gray-400',
    ACTIVE: 'bg-green-500',
    INACTIVE: 'bg-gray-400',
    APPROVED: 'bg-green-500',
    PENDING: 'bg-amber-500',
    SUSPENDED: 'bg-red-500',
  };
  return colors[status] || 'bg-gray-400';
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

export function generateBookingNumber(): string {
  const prefix = 'CAI';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function formatNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
