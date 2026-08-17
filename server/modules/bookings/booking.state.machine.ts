import { prisma } from '../../database';
import { eventBus } from '../../utils/event.bus';
import { BookingStatus, AuditAction } from '@prisma/client';

export type OperationalState =
  | 'REQUESTED'
  | 'AI_ANALYZING'
  | 'SEARCHING_VENDOR'
  | 'VENDOR_ACCEPTED'
  | 'AGENT_ASSIGNED'
  | 'TECHNICIAN_EN_ROUTE'
  | 'ARRIVED'
  | 'OTP_VERIFIED'
  | 'WORK_STARTED'
  | 'WORK_IN_PROGRESS'
  | 'QUALITY_CHECK'
  | 'COMPLETED'
  | 'REVIEW_PENDING'
  | 'REVIEWED'
  | 'CLOSED'
  | 'CANCELLED';

// Map operational states to underlying Prisma BookingStatus enum
export const mapToPrismaStatus = (opState: OperationalState): BookingStatus => {
  switch (opState) {
    case 'REQUESTED':
    case 'AI_ANALYZING':
    case 'SEARCHING_VENDOR':
      return BookingStatus.PENDING;
    case 'VENDOR_ACCEPTED':
      return BookingStatus.VENDOR_ACCEPTED;
    case 'AGENT_ASSIGNED':
    case 'TECHNICIAN_EN_ROUTE':
      return BookingStatus.AGENT_ASSIGNED;
    case 'ARRIVED':
    case 'OTP_VERIFIED':
    case 'WORK_STARTED':
    case 'WORK_IN_PROGRESS':
    case 'QUALITY_CHECK':
      return BookingStatus.IN_PROGRESS;
    case 'COMPLETED':
    case 'REVIEW_PENDING':
    case 'REVIEWED':
    case 'CLOSED':
      return BookingStatus.COMPLETED;
    // Cancelling used to target CLOSED, which maps to COMPLETED — so a
    // cancelled job would have been recorded as successfully finished.
    case 'CANCELLED':
      return BookingStatus.CANCELLED;
    default:
      return BookingStatus.PENDING;
  }
};

/**
 * Where a booking sits in the operational flow when it has no timeline history,
 * inferred from the persisted status it was created or last saved with.
 */
const deriveStateFromStatus = (status: BookingStatus): OperationalState => {
  switch (status) {
    case BookingStatus.PENDING:
      return 'SEARCHING_VENDOR';
    case BookingStatus.CONFIRMED:
    case BookingStatus.VENDOR_ACCEPTED:
      return 'VENDOR_ACCEPTED';
    case BookingStatus.AGENT_ASSIGNED:
      return 'AGENT_ASSIGNED';
    case BookingStatus.IN_PROGRESS:
      return 'WORK_IN_PROGRESS';
    case BookingStatus.COMPLETED:
      return 'COMPLETED';
    default:
      return 'REQUESTED';
  }
};

const ALLOWED_TRANSITIONS: Record<OperationalState, OperationalState[]> = {
  REQUESTED: ['AI_ANALYZING', 'SEARCHING_VENDOR', 'CANCELLED'],
  AI_ANALYZING: ['SEARCHING_VENDOR', 'CANCELLED'],
  SEARCHING_VENDOR: ['VENDOR_ACCEPTED', 'REQUESTED', 'CANCELLED'],
  VENDOR_ACCEPTED: ['AGENT_ASSIGNED', 'CANCELLED'],
  AGENT_ASSIGNED: ['TECHNICIAN_EN_ROUTE', 'CANCELLED'],
  TECHNICIAN_EN_ROUTE: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['OTP_VERIFIED', 'CANCELLED'],
  OTP_VERIFIED: ['WORK_STARTED', 'CANCELLED'],
  WORK_STARTED: ['WORK_IN_PROGRESS'],
  WORK_IN_PROGRESS: ['QUALITY_CHECK'],
  QUALITY_CHECK: ['COMPLETED'],
  COMPLETED: ['REVIEW_PENDING'],
  REVIEW_PENDING: ['REVIEWED'],
  REVIEWED: ['CLOSED'],
  CLOSED: [],
  // Terminal: a cancelled booking cannot re-enter the flow.
  CANCELLED: [],
};

export class BookingStateMachine {
  /**
   * Performs an operational state change transactionally
   */
  static async transitionTo(params: {
    bookingId: string;
    toState: OperationalState;
    actorId: string;
    actorRole: string;
    notes?: string;
  }): Promise<void> {
    const { bookingId, toState, actorId, actorRole, notes } = params;

    await prisma.$transaction(async (tx) => {
      // 1. Get latest booking timeline to determine current state
      const latestTimeline = await tx.bookingTimeline.findFirst({
        where: { bookingId },
        orderBy: { createdAt: 'desc' },
      });

      // No booking has a timeline row until a transition succeeds, and the only
      // writer is this method — below the validation. Defaulting to 'REQUESTED'
      // therefore made the FIRST transition on every booking illegal: bookings
      // are created already CONFIRMED with a vendor attached, so Assign Agent
      // asked for REQUESTED -> AGENT_ASSIGNED and Cancel asked for
      // REQUESTED -> CLOSED, neither of which is in the table. Both threw and
      // surfaced as a 500. Derive the starting point from the booking's own
      // status so existing rows work too — a creation-time seed would not fix
      // the bookings already in the database.
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        select: { status: true },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      const currentState: OperationalState =
        (latestTimeline?.status as OperationalState) || deriveStateFromStatus(booking.status);

      // 2. Validate transition
      if (currentState !== toState) {
        const allowed = ALLOWED_TRANSITIONS[currentState] || [];
        if (!allowed.includes(toState)) {
          throw new Error(`Invalid state transition: cannot transition from ${currentState} to ${toState}`);
        }
      }

      // 3. Update database status of booking
      const prismaStatus = mapToPrismaStatus(toState);
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: prismaStatus },
      });

      // 4. Create timeline log entry
      await tx.bookingTimeline.create({
        data: {
          bookingId,
          status: toState,
          notes: notes || `State transitioned by ${actorRole}.`,
        },
      });

      // 5. Create audit log entry
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: AuditAction.UPDATE,
          resource: 'Booking',
          resourceId: bookingId,
          details: {
            fromState: currentState,
            toState,
            actorRole,
            notes,
          },
        },
      });

      // 6. Publish to the event bus *after* tx succeeds (handled outside or on commit callback)
    });

    // Publish to the event bus
    eventBus.publish('booking.status.changed', {
      bookingId,
      toState,
      actorId,
      actorRole,
      notes,
    });
  }
}
