import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';
import { prisma } from '../../database';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { createNotification } from '../notifications/notification.service';
import { BookingStateMachine } from './booking.state.machine';
import { SAFE_USER_FIELDS } from '../../utils/safeUser';

export const bookingRoutes = Router();

// Helper to auto-create customer profile if missing
async function getOrCreateCustomer(userId: string) {
  let customer = await prisma.customer.findUnique({ where: { userId } });
  if (!customer) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.role === 'CUSTOMER') {
      customer = await prisma.customer.create({
        data: {
          userId,
          profileCompletionPercentage: 100,
          preferences: {},
        },
      });
    }
  }
  return customer;
}

// Retrieve bookings lists (dynamic per role)
bookingRoutes.get('/', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId || !role) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    let bookings: any[] = [];

    if (role === 'CUSTOMER') {
      const customer = await getOrCreateCustomer(userId);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer profile not found' });
      }
      bookings = await prisma.booking.findMany({
        where: { customerId: customer.id },
        include: {
          service: true,
          address: true,
          vendor: true,
          agent: { include: { user: { select: SAFE_USER_FIELDS } } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({ where: { userId } });
      if (!vendor) {
        return res.status(404).json({ success: false, message: 'Vendor profile not found' });
      }
      bookings = await prisma.booking.findMany({
        where: {
          OR: [
            { vendorId: vendor.id },
            { status: BookingStatus.PENDING },
          ],
        },
        include: {
          service: true,
          address: true,
          customer: { include: { user: { select: SAFE_USER_FIELDS } } },
          agent: { include: { user: { select: SAFE_USER_FIELDS } } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (role === 'AGENT') {
      const agent = await prisma.agent.findUnique({ where: { userId } });
      if (!agent) {
        return res.status(404).json({ success: false, message: 'Agent profile not found' });
      }
      bookings = await prisma.booking.findMany({
        where: { agentId: agent.id },
        include: {
          service: true,
          address: true,
          customer: { include: { user: { select: SAFE_USER_FIELDS } } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (role === 'ADMIN') {
      bookings = await prisma.booking.findMany({
        include: {
          service: true,
          address: true,
          customer: { include: { user: { select: SAFE_USER_FIELDS } } },
          vendor: true,
          agent: { include: { user: { select: SAFE_USER_FIELDS } } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch bookings' });
  }
});

// Get single booking — enforce ownership
bookingRoutes.get('/:id', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
        address: true,
        customer: { include: { user: { select: SAFE_USER_FIELDS } } },
        vendor: { include: { user: { select: SAFE_USER_FIELDS } } },
        agent: { include: { user: { select: SAFE_USER_FIELDS } } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ownership enforcement
    if (role === 'CUSTOMER' && booking.customer.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({ where: { userId: userId! } });
      if (!vendor || booking.vendorId !== vendor.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch booking detail' });
  }
});

// Create manual booking
bookingRoutes.post('/', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const customer = await getOrCreateCustomer(userId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer profile not found' });
    }

    const {
      serviceId,
      addressId,
      scheduledDate,
      scheduledTime,
      notes = '',
      totalAmount = 1499,
      paymentMethod = 'UPI',
      latitude,
      longitude,
      placeId,
      city,
      state,
      postalCode,
      country,
    } = req.body;

    if (!serviceId || !addressId || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ success: false, message: 'Missing booking details' });
    }

    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      return res.status(400).json({ success: false, message: 'Location coordinates (latitude and longitude) are required' });
    }

    // 1. Service Exists and Active validation
    console.log(`[Service Validation] Fetching service details for ID: ${serviceId}`);
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      console.warn(`[Service Validation] Service ID: ${serviceId} not found.`);
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    if (!service.isActive) {
      console.warn(`[Service Validation] Service "${service.name}" is inactive.`);
      return res.status(400).json({ success: false, message: 'This service is temporarily unavailable in your area.' });
    }

    // 2. Vendor Exists and Active validation
    console.log(`[Vendor Lookup] Finding approved vendor mappings for Service: "${service.name}"`);
    // Consider EVERY approved vendor offering this service, not just the first
    // one found. The previous findFirst() picked a vendor blindly and then
    // failed with "No available agents" whenever that particular vendor had
    // none free — even while other vendors were sitting idle and able to take
    // the job.
    const candidateVendorServices = await prisma.vendorService.findMany({
      where: {
        serviceId: service.id,
        isActive: true,
        vendor: { status: 'APPROVED' },
      },
      include: {
        vendor: {
          include: {
            // Location comes from the agent, not the vendor — Vendor has no
            // coordinates, only serviceAreas.
            agents: { where: { status: 'AVAILABLE' }, include: { location: true } },
            _count: { select: { agents: true } },
          },
        },
      },
    });

    if (candidateVendorServices.length === 0) {
      console.warn(`[Vendor Lookup] No approved vendor offers service "${service.name}"`);
      return res.status(400).json({ success: false, message: 'Vendor unavailable' });
    }

    // Only vendors with a free agent can actually serve the booking.
    const staffedVendors = candidateVendorServices.filter((vs) => vs.vendor.agents.length > 0);

    if (staffedVendors.length === 0) {
      const totalAgents = candidateVendorServices.reduce((sum, vs) => sum + vs.vendor._count.agents, 0);
      console.warn(
        `[Agent Matching] ${candidateVendorServices.length} vendor(s) offer "${service.name}" but none has a free agent ` +
        `(${totalAgents} agent(s) total, all busy or offline)`
      );
      return res.status(409).json({
        success: false,
        message:
          totalAgents === 0
            ? 'No agents are registered for this service yet. Please try another service or contact support.'
            : 'All agents for this service are currently busy. Please pick a different time slot.',
      });
    }

    // Dispatch to the closest FREE AGENT. Agents carry the live coordinates
    // (AgentLocation); the vendor record only has serviceAreas. Agents with no
    // reported location rank last rather than being excluded, so a booking
    // still succeeds when GPS has never been sent.
    const custLat = typeof latitude === 'number' ? latitude : null;
    const custLng = typeof longitude === 'number' ? longitude : null;

    const distanceKmBetween = (lat: number, lng: number) => {
      if (custLat === null || custLng === null) return Number.POSITIVE_INFINITY;
      // Equirectangular approximation — accurate enough for ranking in a city.
      const R = 6371;
      const dLat = ((lat - custLat) * Math.PI) / 180;
      const dLng = ((lng - custLng) * Math.PI) / 180;
      const meanLat = ((lat + custLat) / 2) * (Math.PI / 180);
      const x = dLng * Math.cos(meanLat);
      return Math.sqrt(dLat * dLat + x * x) * R;
    };

    const ranked = staffedVendors
      .flatMap((vs) =>
        vs.vendor.agents.map((a) => ({
          vs,
          agent: a,
          distanceKm: a.location
            ? distanceKmBetween(a.location.latitude, a.location.longitude)
            : Number.POSITIVE_INFINITY,
        }))
      )
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const best = ranked[0];
    const vendorService = best.vs;
    const vendor = vendorService.vendor;
    const agent = best.agent;
    const matchedDistanceKm = Number.isFinite(best.distanceKm) ? best.distanceKm : null;

    const freeAgentCount = ranked.length;
    console.log(
      `[Dispatch] "${vendor.businessName}" chosen from ${staffedVendors.length}/${candidateVendorServices.length} ` +
      `staffed vendors; ${freeAgentCount} free agent(s) considered` +
      `${matchedDistanceKm !== null ? `; nearest ${matchedDistanceKm.toFixed(1)} km` : '; no GPS data'} ` +
      `-> Agent ${agent.id}`
    );
    console.log(`[Agent Matching] Found Agent ID: ${agent.id}`);

    const bookingNumber = `CAI-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const amountVal = parseFloat(totalAmount as string);
    const platformFee = amountVal * 0.1;
    const vendorAmount = amountVal * 0.9;

    // 4. Create booking transactionally (Assign Vendor, Reserve Agent, notify customer & vendor)
    console.log(`[Booking Creation] Initializing transaction for reference: ${bookingNumber}`);
    const result = await prisma.$transaction(async (tx) => {
      // Reserve Agent — mark BUSY to prevent double-assignment
      await tx.agent.update({
        where: { id: agent.id },
        data: { status: 'BUSY' },
      });

      // Create Booking
      const createdBooking = await tx.booking.create({
        data: {
          bookingNumber,
          customerId: customer.id,
          serviceId,
          vendorId: vendor.id,
          agentId: agent.id,
          addressId,
          scheduledDate: new Date(scheduledDate),
          scheduledTime,
          notes,
          totalAmount: amountVal,
          platformFee,
          vendorAmount,
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PENDING,
          ...(paymentMethod ? { paymentMethod: String(paymentMethod).toUpperCase() } : {}),
          latitude: parseFloat(latitude.toString()),
          longitude: parseFloat(longitude.toString()),
          placeId: placeId ? String(placeId) : null,
          city: city ? String(city) : null,
          state: state ? String(state) : null,
          postalCode: postalCode ? String(postalCode) : null,
          country: country ? String(country) : null,
        },
        include: {
          service: true,
          vendor: true,
          agent: { include: { user: { select: SAFE_USER_FIELDS } } },
        },
      });

      return createdBooking;
    });

    // Send notifications
    const bookingResult = result as any;
    await createNotification({
      userId,
      role: 'CUSTOMER',
      title: 'Booking Confirmed! 🚀',
      message: `Your booking for ${service.name} is confirmed with ${vendor.businessName}. Agent: ${bookingResult.agent?.user?.firstName || 'TBA'}. Ref: ${bookingNumber}`,
      type: 'BOOKING',
      priority: 'HIGH',
      actionUrl: '/customer/bookings',
    });

    if (vendor.userId) {
      await createNotification({
        userId: vendor.userId,
        role: 'VENDOR',
        title: 'New Job Dispatched 🎯',
        message: `New booking ${bookingNumber} for ${service.name} has been assigned to your agent ${bookingResult.agent?.user?.firstName || 'TBA'}.`,
        type: 'BOOKING',
        priority: 'HIGH',
        actionUrl: '/vendor/jobs',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking placed successfully.',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create booking' });
  }
});

// Accept booking (Vendor action) - Supports both POST and PATCH
const acceptBookingHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
      return res.status(403).json({ success: false, message: 'Only vendors can accept bookings' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: { include: { user: { select: SAFE_USER_FIELDS } } } },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // If another vendor already claimed this booking, reject
    if (booking.vendorId && booking.vendorId !== vendor.id) {
      return res.status(400).json({ success: false, message: 'Booking has already been accepted by another vendor' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        vendorId: vendor.id,
        status: BookingStatus.CONFIRMED,
      },
    });

    await BookingStateMachine.transitionTo({
      bookingId: id,
      toState: 'VENDOR_ACCEPTED',
      actorId: userId,
      actorRole: 'VENDOR',
      notes: 'Booking accepted by vendor.',
    });

    // Notification to Customer
    await createNotification({
      userId: booking.customer.userId,
      role: 'CUSTOMER',
      title: 'Booking Confirmed!',
      message: `Your booking #${booking.bookingNumber} has been accepted by ${vendor.businessName}.`,
      type: 'BOOKING',
      priority: 'HIGH',
      actionUrl: '/customer/bookings',
    });

    // Notification to Vendor
    await createNotification({
      userId,
      role: 'VENDOR',
      title: 'Job Accepted',
      message: `You successfully accepted booking #${booking.bookingNumber}.`,
      type: 'BOOKING',
      priority: 'MEDIUM',
      actionUrl: '/vendor/jobs',
    });

    res.status(200).json({
      success: true,
      message: 'Booking accepted successfully.',
      data: updatedBooking,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to accept booking' });
  }
};

bookingRoutes.post('/:id/accept', authMiddleware as any, acceptBookingHandler as any);
bookingRoutes.patch('/:id/accept', authMiddleware as any, acceptBookingHandler as any);

// Reject booking (Vendor action) - Supports both POST and PATCH
const rejectBookingHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { reason = 'Vendor rejected' } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
      return res.status(403).json({ success: false, message: 'Only vendors can reject bookings' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: { include: { user: { select: SAFE_USER_FIELDS } } } },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelReason: reason,
      },
    });

    await prisma.bookingStatusHistory.create({
      data: {
        bookingId: id,
        status: BookingStatus.CANCELLED,
        notes: `Rejected by vendor. Reason: ${reason}`,
        changedBy: 'VENDOR',
      },
    });

    // Notification to Customer
    await createNotification({
      userId: booking.customer.userId,
      role: 'CUSTOMER',
      title: 'Booking Cancelled',
      message: `Your booking #${booking.bookingNumber} was declined by provider. Reason: ${reason}`,
      type: 'BOOKING',
      priority: 'HIGH',
      actionUrl: '/customer/bookings',
    });

    res.status(200).json({
      success: true,
      message: 'Booking rejected successfully.',
      data: updatedBooking,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to reject booking' });
  }
};

bookingRoutes.post('/:id/reject', authMiddleware as any, rejectBookingHandler as any);
bookingRoutes.patch('/:id/reject', authMiddleware as any, rejectBookingHandler as any);

// Assign agent (Vendor action) - Supports both POST and PATCH
const assignAgentHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { agentId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
      return res.status(403).json({ success: false, message: 'Only vendors can assign agents' });
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, vendorId: vendor.id },
      include: { user: { select: SAFE_USER_FIELDS } },
    });

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found or does not belong to your agency' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: { include: { user: { select: SAFE_USER_FIELDS } } } },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        agentId: agent.id,
      },
    });

    await BookingStateMachine.transitionTo({
      bookingId: id,
      toState: 'AGENT_ASSIGNED',
      actorId: userId,
      actorRole: 'VENDOR',
      notes: `Agent ${agent.user.firstName} ${agent.user.lastName} assigned to job.`,
    });

    // Notify Customer
    await createNotification({
      userId: booking.customer.userId,
      role: 'CUSTOMER',
      title: 'Agent Assigned! 👤',
      message: `Agent ${agent.user.firstName} ${agent.user.lastName} has been assigned to your service #${booking.bookingNumber}.`,
      type: 'BOOKING',
      priority: 'HIGH',
      actionUrl: '/customer/bookings',
    });

    // Notify Agent
    await createNotification({
      userId: agent.userId,
      role: 'AGENT',
      title: 'New Assignment 📋',
      message: `You have been assigned to service booking #${booking.bookingNumber}.`,
      type: 'BOOKING',
      priority: 'HIGH',
    });

    res.status(200).json({
      success: true,
      message: 'Agent assigned to booking successfully.',
      data: updatedBooking,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to assign agent' });
  }
};

bookingRoutes.post('/:id/assign', authMiddleware as any, assignAgentHandler as any);
bookingRoutes.patch('/:id/assign', authMiddleware as any, assignAgentHandler as any);

// Cancel booking (Customer or Admin action) - Supports both POST and PATCH
const cancelBookingHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params;
    const { reason = 'Cancelled by user' } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Only customers and admins can cancel
    if (role !== 'CUSTOMER' && role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only customers or admins can cancel bookings' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: { include: { user: { select: SAFE_USER_FIELDS } } },
        vendor: { include: { user: { select: SAFE_USER_FIELDS } } },
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        cancelReason: reason,
        paymentStatus: booking.paymentStatus === PaymentStatus.PAID ? PaymentStatus.REFUNDED : PaymentStatus.FAILED,
      },
    });

    await BookingStateMachine.transitionTo({
      bookingId: id,
      toState: 'CLOSED',
      actorId: userId,
      actorRole: req.user?.role || 'CUSTOMER',
      notes: `Cancelled. Reason: ${reason}`,
    });

    // Notify Customer
    await createNotification({
      userId: booking.customer.userId,
      role: 'CUSTOMER',
      title: 'Booking Cancelled',
      message: `Your booking #${booking.bookingNumber} has been successfully cancelled.`,
      type: 'BOOKING',
      priority: 'MEDIUM',
      actionUrl: '/customer/bookings',
    });

    // Notify Vendor (if assigned)
    if (booking.vendor) {
      await createNotification({
        userId: booking.vendor.userId,
        role: 'VENDOR',
        title: 'Job Cancelled by Customer ⚠️',
        message: `Booking #${booking.bookingNumber} has been cancelled by the customer.`,
        type: 'BOOKING',
        priority: 'HIGH',
        actionUrl: '/vendor/jobs',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
      data: updatedBooking,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to cancel booking' });
  }
};

bookingRoutes.post('/:id/cancel', authMiddleware as any, cancelBookingHandler as any);
bookingRoutes.patch('/:id/cancel', authMiddleware as any, cancelBookingHandler as any);

/**
 * Route: POST /api/v1/bookings/:id/transition
 * Transition operational state using the Booking State Machine
 */
bookingRoutes.post('/:id/transition', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { toState, notes } = req.body;
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId || !role) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!toState) {
      return res.status(400).json({ success: false, message: 'Please provide a destination operational state.' });
    }

    await BookingStateMachine.transitionTo({
      bookingId: id,
      toState,
      actorId: userId,
      actorRole: role,
      notes,
    });

    res.status(200).json({
      success: true,
      message: `Successfully transitioned booking to operational state ${toState}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'State transition failed.' });
  }
});

// Submit review (Customer only, booking must be COMPLETED)
bookingRoutes.post('/:id/review', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params;

    if (!userId || role !== 'CUSTOMER') {
      return res.status(403).json({ success: false, message: 'Only customers can submit reviews' });
    }

    const { rating, review: reviewText, tags = [] } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const customer = await getOrCreateCustomer(userId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer profile not found' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { vendor: true, agent: true },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.customerId !== customer.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      return res.status(400).json({ success: false, message: 'Reviews can only be submitted for completed bookings' });
    }

    // Check if review already exists
    const existing = await prisma.review.findFirst({ where: { bookingId: id } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Review already submitted for this booking' });
    }

    const savedReview = await prisma.$transaction(async (tx) => {
      const r = await tx.review.create({
        data: {
          bookingId: id,
          customerId: customer.id,
          vendorId: booking.vendorId || undefined,
          rating: Number(rating),
          comment: reviewText || '',
        },
      });

      // Update vendor aggregate rating
      if (booking.vendorId) {
        const allReviews = await tx.review.findMany({ where: { vendorId: booking.vendorId }, select: { rating: true } });
        const avgRating = allReviews.reduce((sum, rv) => sum + rv.rating, 0) / allReviews.length;
        await tx.vendor.update({
          where: { id: booking.vendorId },
          data: { rating: Math.round(avgRating * 10) / 10 },
        });
      }

      return r;
    });

    res.status(201).json({ success: true, message: 'Review submitted successfully.', data: savedReview });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to submit review' });
  }
});

