/**
 * The only User columns that may be sent to a client.
 *
 * Prisma returns every column unless told otherwise, so `include: { user: true }`
 * quietly ships passwordHash, resetToken and phoneOtp along with the name and
 * email the caller actually wanted. That leaked one user's credential material
 * to another — a vendor reading a booking received the customer's bcrypt hash.
 *
 * Use this wherever a User is nested in a response:
 *   include: { user: { select: SAFE_USER_FIELDS } }
 */
export const SAFE_USER_FIELDS = {
  id: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  role: true,
  avatar: true,
  isActive: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;
