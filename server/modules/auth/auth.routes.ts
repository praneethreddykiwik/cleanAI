import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { prisma } from '../../database';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';

export const authRoutes = Router();

// Onboarding & Signup
authRoutes.post('/register', async (req, res) => {
  const { email, phone, firstName, lastName, password, role } = req.body;

  if (!email || !phone || !firstName || !lastName || !password || !role) {
    return res.status(400).json({ success: false, message: 'All registration fields are required' });
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email or phone number already exists',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and associated profile transactionally
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          phone,
          firstName,
          lastName,
          passwordHash,
          role,
          isActive: true,
          isEmailVerified: true, // Auto verify for simplicity
          isPhoneVerified: true,
        },
      });

      if (role === 'CUSTOMER') {
        await tx.customer.create({
          data: {
            userId: createdUser.id,
            profileCompletionPercentage: 100,
            preferences: {},
          },
        });
      } else if (role === 'VENDOR') {
        await tx.vendor.create({
          data: {
            userId: createdUser.id,
            businessName: `${firstName}'s Premium Services`,
            status: 'PENDING',    // Requires admin approval before going live
            isVerified: false,
          },
        });
      }

      return createdUser;
    });

    // Generate tokens
    const accessToken = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign({ sub: user.id, role: user.role }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        deviceInfo: req.headers['user-agent'] || 'Unknown Device',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
});

// Credentials Check
authRoutes.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign({ sub: user.id, role: user.role }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });

    // Revoke old refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        deviceInfo: req.headers['user-agent'] || 'Unknown Device',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Login failed' });
  }
});

// Access token renewal
authRoutes.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token is required' });
  }

  try {
    const savedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!savedToken || savedToken.isRevoked || savedToken.expiresAt < new Date()) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
      sub: string;
      role: 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'AGENT';
    };

    const accessToken = jwt.sign({ sub: decoded.sub, role: decoded.role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    res.status(200).json({
      success: true,
      data: { accessToken },
    });
  } catch (error: any) {
    res.status(401).json({ success: false, message: 'Token refresh failed' });
  }
});

// Get current authenticated user details
authRoutes.get('/me', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: {
        customer: true,
        vendor: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        customer: user.customer,
        vendor: user.vendor,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch user context' });
  }
});

// Terminate Session
authRoutes.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  try {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
});

// Update profile (authenticated)
authRoutes.patch('/profile', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { firstName, lastName, phone, avatarUrl } = req.body;
    const updateData: Record<string, unknown> = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName)  updateData.lastName  = lastName;
    if (phone)     updateData.phone     = phone;
    if (avatarUrl) updateData.avatarUrl = avatarUrl;

    const updated = await prisma.user.update({ where: { id: userId }, data: updateData });
    res.status(200).json({ success: true, data: { id: updated.id, firstName: updated.firstName, lastName: updated.lastName, email: updated.email, phone: updated.phone } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Profile update failed' });
  }
});

// Change password (authenticated)
authRoutes.post('/change-password', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    // Revoke all refresh tokens so existing sessions are invalidated
    await prisma.refreshToken.deleteMany({ where: { userId } });

    res.status(200).json({ success: true, message: 'Password changed successfully. Please log in again.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Password change failed' });
  }
});

// Forgot password — issue a reset token
authRoutes.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return 200 to prevent email enumeration
    if (!user) {
      return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate a signed reset token (expires in 1 hour)
    const resetToken = jwt.sign({ sub: user.id, purpose: 'password_reset' }, env.JWT_SECRET, { expiresIn: '1h' });

    // Store in user record (emailVerifyToken reused as reset token field)
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifyToken: resetToken } });

    // TODO: Send via email service when RESEND_API_KEY is configured
    // For now, return the token in dev mode only
    const isDevMode = process.env.NODE_ENV !== 'production';
    res.status(200).json({
      success: true,
      message: 'Password reset link sent.',
      ...(isDevMode && { resetToken }), // Expose only in dev
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Forgot password failed' });
  }
});

// Reset password using token
authRoutes.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token and newPassword are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string; purpose: string };
    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ success: false, message: 'Invalid reset token' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user || user.emailVerifyToken !== token) {
      return res.status(400).json({ success: false, message: 'Invalid or already-used reset token' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, emailVerifyToken: null },
    });
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    res.status(200).json({ success: true, message: 'Password reset successful. Please log in.' });
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ success: false, message: 'Reset token has expired. Please request a new one.' });
    }
    res.status(500).json({ success: false, message: error.message || 'Password reset failed' });
  }
});

// Verify email via token
authRoutes.post('/verify-email', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, message: 'Verification token is required' });
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string; purpose: string };
    if (decoded.purpose !== 'email_verify') {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }
    await prisma.user.update({
      where: { id: decoded.sub },
      data: { isEmailVerified: true, emailVerifyToken: null },
    });
    res.status(200).json({ success: true, message: 'Email verified successfully.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
  }
});

// Verify OTP (phone-based login)
authRoutes.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
  try {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // In production, validate against stored OTP in cache/DB.
    // For now, accept a fixed dev OTP of '000000'.
    const isDevMode = process.env.NODE_ENV !== 'production';
    const isValid = isDevMode ? otp === '000000' : false;

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    await prisma.user.update({ where: { id: user.id }, data: { isPhoneVerified: true } });
    const accessToken = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
    const refreshToken = jwt.sign({ sub: user.id, role: user.role }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any });
    await prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });

    res.status(200).json({ success: true, data: { accessToken, refreshToken, user: { id: user.id, role: user.role } } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'OTP verification failed' });
  }
});

// Resend OTP
authRoutes.post('/resend-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: 'Phone is required' });
  try {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    // TODO: Integrate SMS provider (Twilio / MSG91) here
    // For dev, OTP is always 000000
    res.status(200).json({ success: true, message: 'OTP sent successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Resend OTP failed' });
  }
});
