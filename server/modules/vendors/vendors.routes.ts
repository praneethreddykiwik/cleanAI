import { Router, Response } from 'express';
import { authMiddleware, authorizeRoles, AuthenticatedRequest } from '../../middleware/auth';
import { prisma } from '../../database';
import { SAFE_USER_FIELDS } from '../../utils/safeUser';

export const vendorRoutes = Router();

// Business Profile details
vendorRoutes.get('/profile', authMiddleware as any, authorizeRoles('VENDOR', 'ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId },
      include: { user: { select: SAFE_USER_FIELDS } },
    });

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        id: vendor.id,
        businessName: vendor.businessName,
        businessDescription: vendor.businessDescription,
        ownerName: `${vendor.user.firstName} ${vendor.user.lastName}`,
        gstNumber: vendor.gstNumber,
        panNumber: vendor.panNumber,
        bankAccountNumber: vendor.bankAccountNumber,
        bankIfscCode: vendor.bankIfscCode,
        status: vendor.status,
        rating: vendor.rating,
        totalJobs: vendor.totalJobs,
        serviceAreas: vendor.serviceAreas,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch profile' });
  }
});

vendorRoutes.patch('/profile', authMiddleware as any, authorizeRoles('VENDOR') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const {
      businessName,
      businessDescription,
      gstNumber,
      panNumber,
      bankAccountNumber,
      bankIfscCode,
      serviceAreas,
      ownerFirstName,
      ownerLastName,
    } = req.body;

    const updated = await prisma.$transaction(async (tx) => {
      const v = await tx.vendor.update({
        where: { id: vendor.id },
        data: {
          businessName: businessName || undefined,
          businessDescription: businessDescription || undefined,
          gstNumber: gstNumber || undefined,
          panNumber: panNumber || undefined,
          bankAccountNumber: bankAccountNumber || undefined,
          bankIfscCode: bankIfscCode || undefined,
          serviceAreas: serviceAreas || undefined,
        },
      });

      if (ownerFirstName || ownerLastName) {
        await tx.user.update({
          where: { id: userId },
          data: {
            firstName: ownerFirstName || undefined,
            lastName: ownerLastName || undefined,
          },
        });
      }

      return v;
    });

    res.status(200).json({
      success: true,
      message: 'Business configurations updated successfully.',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update profile' });
  }
});

// Pricing catalog config
vendorRoutes.get('/pricing', authMiddleware as any, authorizeRoles('VENDOR') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    let vendorServices = await prisma.vendorService.findMany({
      where: { vendorId: vendor.id },
      include: { service: true },
    });

    // Self-healing: if no custom prices set, link all active services with default prices
    if (vendorServices.length === 0) {
      const allServices = await prisma.service.findMany({ where: { isActive: true } });
      await prisma.vendorService.createMany({
        data: allServices.map((s) => ({
          vendorId: vendor.id,
          serviceId: s.id,
          price: s.basePrice,
          isActive: true,
        })),
        skipDuplicates: true,
      });

      vendorServices = await prisma.vendorService.findMany({
        where: { vendorId: vendor.id },
        include: { service: true },
      });
    }

    const mapped = vendorServices.map((vs) => ({
      id: vs.id,
      serviceId: vs.serviceId,
      serviceName: vs.service.name,
      minPrice: vs.service.basePrice,
      maxPrice: vs.service.basePrice * 1.5,
      price: vs.price,
      isActive: vs.isActive,
    }));

    res.status(200).json({
      success: true,
      data: mapped,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch pricing' });
  }
});

vendorRoutes.put('/pricing', authMiddleware as any, authorizeRoles('VENDOR') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const pricesList = req.body; // Expect array: [{ serviceId: '...', price: 1500, isActive: true }]

    if (!Array.isArray(pricesList)) {
      return res.status(400).json({ success: false, message: 'Pricing payload must be an array' });
    }

    await prisma.$transaction(
      pricesList.map((p) =>
        prisma.vendorService.upsert({
          where: {
            vendorId_serviceId: {
              vendorId: vendor.id,
              serviceId: p.serviceId,
            },
          },
          update: {
            price: parseFloat(p.price),
            isActive: p.isActive !== undefined ? p.isActive : true,
          },
          create: {
            vendorId: vendor.id,
            serviceId: p.serviceId,
            price: parseFloat(p.price),
            isActive: p.isActive !== undefined ? p.isActive : true,
          },
        })
      )
    );

    res.status(200).json({
      success: true,
      message: 'Service catalog pricing saved successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to save pricing' });
  }
});

// File upload endpoints (License / GST documents)
vendorRoutes.post('/documents/upload', authMiddleware as any, authorizeRoles('VENDOR') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const { type, name, url } = req.body;

    if (!type || !name || !url) {
      return res.status(400).json({ success: false, message: 'Document type, name, and url are required' });
    }

    const doc = await prisma.document.create({
      data: {
        vendorId: vendor.id,
        type,
        name,
        url,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded for compliance checks.',
      data: doc,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to save document' });
  }
});

// Vendor Dashboard summary
vendorRoutes.get('/dashboard-summary', authMiddleware as any, authorizeRoles('VENDOR') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId },
      include: {
        vendorServices: {
          where: { isActive: true },
        },
      },
    });

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const offeredServiceIds = vendor.vendorServices.map((vs) => vs.serviceId);

    // 1. Incoming Jobs
    const incomingJobs = await prisma.booking.findMany({
      where: {
        status: 'PENDING',
        serviceId: { in: offeredServiceIds },
        vendorId: null,
      },
      include: {
        service: true,
        address: true,
        customer: { include: { user: { select: SAFE_USER_FIELDS } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 2. Today's Jobs
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayJobs = await prisma.booking.findMany({
      where: {
        vendorId: vendor.id,
        scheduledDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        service: true,
        address: true,
        customer: { include: { user: { select: SAFE_USER_FIELDS } } },
        agent: { include: { user: { select: SAFE_USER_FIELDS } } },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    // 3. Revenue this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const revenueAggregation = await prisma.booking.aggregate({
      where: {
        vendorId: vendor.id,
        paymentStatus: 'PAID',
        createdAt: { gte: firstDayOfMonth },
      },
      _sum: {
        vendorAmount: true,
      },
    });

    const monthlyRevenue = revenueAggregation._sum.vendorAmount || 0;

    // 4. Active agents count
    const activeAgentsCount = await prisma.agent.count({
      where: {
        vendorId: vendor.id,
        status: 'AVAILABLE',
      },
    });

    // 5. Total agents list
    const agentsList = await prisma.agent.findMany({
      where: { vendorId: vendor.id },
      include: { user: { select: SAFE_USER_FIELDS } },
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          incomingJobsCount: incomingJobs.length,
          todayJobsCount: todayJobs.length,
          monthlyRevenue,
          activeAgentsCount,
        },
        incomingJobs,
        todayJobs,
        agents: agentsList,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to aggregate vendor dashboard summary' });
  }
});

// GET /vendors/analytics — real month-by-month revenue + service breakdown
vendorRoutes.get('/analytics', authMiddleware as any, authorizeRoles('VENDOR') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor profile not found' });

    // Total earnings (all time)
    const totalEarningsAgg = await prisma.booking.aggregate({
      where: { vendorId: vendor.id, paymentStatus: 'PAID' },
      _sum: { vendorAmount: true },
    });
    const totalEarnings = totalEarningsAgg._sum.vendorAmount || 0;

    // Completed jobs
    const completedJobs = await prisma.booking.count({
      where: { vendorId: vendor.id, status: 'COMPLETED' },
    });

    // Average ticket size
    const avgAgg = await prisma.booking.aggregate({
      where: { vendorId: vendor.id, status: 'COMPLETED' },
      _avg: { totalAmount: true },
    });
    const avgTicket = avgAgg._avg.totalAmount || 0;

    // Rating
    const rating = vendor.rating || 0;

    // Month-over-month revenue (last 6 months)
    const now = new Date();
    const monthlyRevenue: { month: string; val: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const agg = await prisma.booking.aggregate({
        where: {
          vendorId: vendor.id,
          paymentStatus: 'PAID',
          createdAt: { gte: start, lte: end },
        },
        _sum: { vendorAmount: true },
      });
      monthlyRevenue.push({
        month: d.toLocaleString('default', { month: 'short' }),
        val: Math.round((agg._sum.vendorAmount || 0) / 1000), // in k
      });
    }

    // Service breakdown (top services by job count)
    const serviceBookings = await prisma.booking.groupBy({
      by: ['serviceId'],
      where: { vendorId: vendor.id, status: 'COMPLETED' },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 4,
    });

    const serviceIds = serviceBookings.map((s) => s.serviceId);
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true },
    });
    const totalJobsForBreakdown = serviceBookings.reduce((acc, s) => acc + s._count.id, 0) || 1;
    const serviceBreakdown = serviceBookings.map((s) => {
      const svc = services.find((sv) => sv.id === s.serviceId);
      return {
        name: svc?.name || 'Unknown',
        count: s._count.id,
        percentage: Math.round((s._count.id / totalJobsForBreakdown) * 100),
      };
    });

    res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        completedJobs,
        avgTicket: Math.round(avgTicket),
        rating,
        monthlyRevenue,
        serviceBreakdown,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch analytics' });
  }
});

// Proxy: GET /vendors/agents — delegates to the agents table filtered by this vendor
// Fixes frontend calling /vendors/agents instead of /agents
vendorRoutes.get('/agents', authMiddleware as any, authorizeRoles('VENDOR', 'ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor profile not found' });

    const agents = await prisma.agent.findMany({
      where: { vendorId: vendor.id },
      include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: agents });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch agents' });
  }
});
