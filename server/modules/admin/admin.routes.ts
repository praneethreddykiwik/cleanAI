import { Router, Response } from 'express';
import { authMiddleware, authorizeRoles, AuthenticatedRequest } from '../../middleware/auth';
import { prisma } from '../../database';
import { createNotification } from '../notifications/notification.service';
import { VendorStatus } from '@prisma/client';
import { SAFE_USER_FIELDS } from '../../utils/safeUser';

export const adminRoutes = Router();

// Stats aggregation dynamically from Neon
adminRoutes.get('/stats', authMiddleware as any, authorizeRoles('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeVendors = await prisma.vendor.count({ where: { status: 'APPROVED' } });
    const totalBookings = await prisma.booking.count();
    
    // platformRevenue = sum of platformFee
    const revenueAggregation = await prisma.booking.aggregate({
      where: {
        paymentStatus: 'PAID',
      },
      _sum: {
        platformFee: true,
      },
    });

    const platformRevenue = revenueAggregation._sum.platformFee || 0;

    const completedBookingsCount = await prisma.booking.count({
      where: { status: 'COMPLETED' },
    });

    const completionRate = totalBookings > 0 ? Math.round((completedBookingsCount / totalBookings) * 100) : 100;
    const pendingApprovals = await prisma.vendor.count({ where: { status: 'PENDING' } });

    // Live monitoring stats
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100;

    const systemLogs = await prisma.systemLog.findMany({
      where: { action: 'AI_COMPLEXITY_ANALYSIS' }
    });
    const totalAIRequests = systemLogs.length;
    const failedAIRequests = systemLogs.filter(l => l.status === 'FAILED').length;
    const cacheHitCount = systemLogs.filter(l => l.message && (l.message.includes('Redis') || l.message.includes('Postgres'))).length;
    
    const cacheHitRatio = totalAIRequests > 0 ? Math.round((cacheHitCount / totalAIRequests) * 100) : 100;
    
    const successLogs = systemLogs.filter(l => l.status === 'SUCCESS');
    const avgAILatency = successLogs.length > 0
      ? Math.round(successLogs.reduce((acc, curr) => acc + (curr.visionLatencyMs || 0), 0) / successLogs.length)
      : 1200; // default 1.2s fallback

    const failedPayments = await prisma.payment.count({
      where: { status: 'FAILED' }
    });

    const onlineVendors = await prisma.liveSession.count({
      where: { status: 'ONLINE' }
    });

    const activeAgents = await prisma.agent.count({
      where: { status: 'AVAILABLE' }
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeVendors,
        totalBookings,
        platformRevenue,
        completionRate,
        pendingApprovals,
        avgResponseTime: avgAILatency,
        platformHealth: 99,
        monitoring: {
          heapUsedMB,
          cacheHitRatio,
          failedAIRequests,
          failedPayments,
          onlineVendors,
          activeAgents,
        }
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to aggregate statistics' });
  }
});

// Get detailed platform financial reports
adminRoutes.get('/financials', authMiddleware as any, authorizeRoles('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalPayments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'PAID' },
    });

    const pendingSettlements = await prisma.settlement.aggregate({
      _sum: { amount: true },
      where: { status: 'PENDING' },
    });

    const processedSettlements = await prisma.settlement.aggregate({
      _sum: { amount: true },
      where: { status: 'PROCESSED' },
    });

    const totalRefunds = await prisma.refund.aggregate({
      _sum: { amount: true },
      where: { status: 'PROCESSED' },
    });

    const couponUsage = await prisma.coupon.findMany({
      select: { code: true, usageCount: true, value: true },
    });

    const subscriptionCount = await prisma.subscription.count({
      where: { status: 'ACTIVE' },
    });

    const totalPaidBookings = await prisma.booking.count({ where: { status: 'COMPLETED' } });
    const repeatCustomers = await prisma.booking.groupBy({
      by: ['customerId'],
      having: {
        id: { _count: { gt: 1 } },
      },
    });

    const repeatBookingRate = totalPaidBookings > 0 ? (repeatCustomers.length / totalPaidBookings) * 100 : 0;
    const totalRev = totalPayments._sum.amount || 0;
    const grossMargin = totalRev * 0.15; // 15% platform commission
    const netMargin = grossMargin - (totalRefunds._sum.amount || 0);

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: totalRev,
        pendingSettlements: pendingSettlements._sum.amount || 0,
        processedSettlements: processedSettlements._sum.amount || 0,
        totalRefunds: totalRefunds._sum.amount || 0,
        couponStats: couponUsage,
        activeSubscriptions: subscriptionCount,
        repeatBookingRate: Math.round(repeatBookingRate * 100) / 100,
        grossMargin: Math.round(grossMargin * 100) / 100,
        netMargin: Math.round(netMargin * 100) / 100,
        aiCostPerBooking: 0.05, // e.g. ₹0.05
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch financial stats' });
  }
});

// Configure general platform settings
adminRoutes.get('/settings', authMiddleware as any, authorizeRoles('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await prisma.setting.findMany();
    const mapped: any = {};
    settings.forEach((s) => {
      mapped[s.key] = s.value === 'true' ? true : s.value === 'false' ? false : s.value;
    });

    res.status(200).json({
      success: true,
      data: {
        maintenanceMode: mapped.maintenanceMode || false,
        platformFee: parseInt(mapped.platformFee || '10', 10),
        vendorAutoApprove: mapped.vendorAutoApprove || false,
        aiMatchingEnabled: mapped.aiMatchingEnabled || true,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch settings' });
  }
});

adminRoutes.post('/settings', authMiddleware as any, authorizeRoles('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settingsBody = req.body; // e.g. { maintenanceMode: false, platformFee: 10, ... }

    await prisma.$transaction(
      Object.entries(settingsBody).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value), isPublic: true },
        })
      )
    );

    res.status(200).json({
      success: true,
      message: 'Global settings updated successfully.',
      data: settingsBody,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update settings' });
  }
});

// List all vendors for admin verification dashboard
adminRoutes.get('/vendors', authMiddleware as any, authorizeRoles('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: { user: { select: SAFE_USER_FIELDS }, documents: true },
    });
    res.status(200).json({ success: true, data: vendors });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch vendors list' });
  }
});

// Approve vendor profile
adminRoutes.patch('/vendors/:id/approve', authMiddleware as any, authorizeRoles('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: { user: { select: SAFE_USER_FIELDS } },
    });

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const updated = await prisma.vendor.update({
      where: { id },
      data: { status: 'APPROVED', isVerified: true },
    });

    // Notify Vendor
    await createNotification({
      userId: vendor.userId,
      role: 'VENDOR',
      title: 'Profile Approved! 🎉',
      message: 'Your vendor onboarding has been verified and approved. You are now live!',
      type: 'SYSTEM',
      priority: 'HIGH',
      actionUrl: '/vendor/dashboard',
    });

    res.status(200).json({
      success: true,
      message: 'Vendor onboarding approved successfully.',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to approve vendor' });
  }
});

// Reject vendor profile
adminRoutes.patch('/vendors/:id/reject', authMiddleware as any, authorizeRoles('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason = 'Failed compliance checklist' } = req.body;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: { user: { select: SAFE_USER_FIELDS } },
    });

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const updated = await prisma.vendor.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    // Notify Vendor
    await createNotification({
      userId: vendor.userId,
      role: 'VENDOR',
      title: 'Application Rejected ⚠️',
      message: `Your vendor onboarding request was rejected. Reason: ${reason}`,
      type: 'SYSTEM',
      priority: 'HIGH',
    });

    res.status(200).json({
      success: true,
      message: 'Vendor onboarding rejected.',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to reject vendor' });
  }
});

// Suspend a general user
adminRoutes.patch('/users/:id/suspend', authMiddleware as any, authorizeRoles('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(200).json({
      success: true,
      message: 'User account suspended successfully.',
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to suspend user' });
  }
});

// Restore a general user
adminRoutes.patch('/users/:id/restore', authMiddleware as any, authorizeRoles('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    res.status(200).json({
      success: true,
      message: 'User account restored successfully.',
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to restore user' });
  }
});

// List all users for admin directory dashboard
adminRoutes.get('/users', authMiddleware as any, authorizeRoles('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Select explicitly. An unqualified findMany returned every column, so this
    // response carried each user's bcrypt passwordHash, password-reset token and
    // phone OTP. Credential material should never leave the database — not even
    // for an admin, since one leaked session would expose every hash for
    // offline cracking.
    const users = await prisma.user.findMany({
      select: {
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
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch users list' });
  }
});

// List support tickets for admin queue
adminRoutes.get('/support-tickets', authMiddleware as any, authorizeRoles('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      include: {
        customer: { include: { user: { select: SAFE_USER_FIELDS } } },
        booking: { select: { bookingNumber: true, id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = tickets.map((t) => ({
      id: t.id,
      userEmail: t.customer.user.email,
      userName: `${t.customer.user.firstName} ${t.customer.user.lastName}`,
      issue: t.issueDescription,
      status: t.status,
      bookingRef: t.booking?.bookingNumber || null,
      aiAnalysis: t.aiAnalysis,
      createdAt: t.createdAt,
    }));

    res.status(200).json({ success: true, data: mapped });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch support tickets' });
  }
});

// Mark support ticket as resolved
adminRoutes.patch('/support-tickets/:id/resolve', authMiddleware as any, authorizeRoles('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { status: 'RESOLVED' },
    });
    res.status(200).json({ success: true, message: 'Ticket resolved.', data: ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to resolve ticket' });
  }
});

// ============================================================================
// Dirtiness-tier pricing
// ----------------------------------------------------------------------------
// The vision agent rates each job 1–5 stars for how dirty it is. That rating
// selects a per-service price from here, so a 5-star job is quoted higher than
// a 1-star one. These live in the database (not code) so admins can retune
// pricing per service without a deploy.
// ============================================================================

const TIER_LABELS: Record<number, string> = {
  1: 'Light',
  2: 'Mild',
  3: 'Moderate',
  4: 'Heavy',
  5: 'Extreme',
};

// Multipliers used only to seed a sensible starting ladder for a service that
// has never been configured. Admins overwrite these immediately.
const DEFAULT_TIER_MULTIPLIERS: Record<number, number> = {
  1: 0.6,
  2: 0.8,
  3: 1.0,
  4: 1.35,
  5: 1.75,
};

/** All services with their five pricing tiers, creating defaults on first read. */
adminRoutes.get('/pricing-tiers', authMiddleware as any, authorizeRoles('ADMIN') as any, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { pricingTiers: { orderBy: { level: 'asc' } } },
    });

    // Backfill any service that has no tiers yet, so the admin screen always
    // shows five editable rows instead of an empty state.
    const needsSeed = services.filter((s) => s.pricingTiers.length === 0);
    if (needsSeed.length > 0) {
      await prisma.servicePricingTier.createMany({
        data: needsSeed.flatMap((s) =>
          [1, 2, 3, 4, 5].map((level) => ({
            serviceId: s.id,
            level,
            label: TIER_LABELS[level],
            price: Math.round((s.basePrice || 499) * DEFAULT_TIER_MULTIPLIERS[level]),
          }))
        ),
        skipDuplicates: true,
      });

      const refreshed = await prisma.service.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { pricingTiers: { orderBy: { level: 'asc' } } },
      });
      return res.status(200).json({ success: true, data: refreshed });
    }

    res.status(200).json({ success: true, data: services });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to load pricing tiers' });
  }
});

/** Replace the five tier prices for one service. */
adminRoutes.put('/pricing-tiers/:serviceId', authMiddleware as any, authorizeRoles('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { tiers } = req.body as { tiers?: Array<{ level: number; price: number; label?: string }> };

    if (!Array.isArray(tiers) || tiers.length === 0) {
      return res.status(400).json({ success: false, message: 'tiers must be a non-empty array' });
    }

    for (const t of tiers) {
      const level = Number(t.level);
      const price = Number(t.price);
      if (!Number.isInteger(level) || level < 1 || level > 5) {
        return res.status(400).json({ success: false, message: 'Each tier level must be an integer between 1 and 5' });
      }
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ success: false, message: 'Each tier price must be zero or greater' });
      }
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    await prisma.$transaction(
      tiers.map((t) =>
        prisma.servicePricingTier.upsert({
          where: { serviceId_level: { serviceId, level: Number(t.level) } },
          update: { price: Number(t.price), label: t.label || TIER_LABELS[Number(t.level)] },
          create: {
            serviceId,
            level: Number(t.level),
            price: Number(t.price),
            label: t.label || TIER_LABELS[Number(t.level)],
          },
        })
      )
    );

    const updated = await prisma.servicePricingTier.findMany({
      where: { serviceId },
      orderBy: { level: 'asc' },
    });

    res.status(200).json({ success: true, message: 'Pricing tiers updated', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update pricing tiers' });
  }
});
