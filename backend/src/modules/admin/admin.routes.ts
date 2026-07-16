import { Router, Response } from 'express';
import { authMiddleware, authorizeRoles, AuthenticatedRequest } from '@/middleware/auth';
import { prisma } from '@/database';
import { createNotification } from '../notifications/notification.service';
import { VendorStatus } from '@prisma/client';

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
      include: { user: true, documents: true },
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
      include: { user: true },
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
      include: { user: true },
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
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch users list' });
  }
});
