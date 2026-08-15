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
  | 'CLOSED';

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
    default:
      return BookingStatus.PENDING;
  }
};

const ALLOWED_TRANSITIONS: Record<OperationalState, OperationalState[]> = {
  REQUESTED: ['AI_ANALYZING', 'SEARCHING_VENDOR'],
  AI_ANALYZING: ['SEARCHING_VENDOR'],
  SEARCHING_VENDOR: ['VENDOR_ACCEPTED', 'REQUESTED'],
  VENDOR_ACCEPTED: ['AGENT_ASSIGNED'],
  AGENT_ASSIGNED: ['TECHNICIAN_EN_ROUTE'],
  TECHNICIAN_EN_ROUTE: ['ARRIVED'],
  ARRIVED: ['OTP_VERIFIED'],
  OTP_VERIFIED: ['WORK_STARTED'],
  WORK_STARTED: ['WORK_IN_PROGRESS'],
  WORK_IN_PROGRESS: ['QUALITY_CHECK'],
  QUALITY_CHECK: ['COMPLETED'],
  COMPLETED: ['REVIEW_PENDING'],
  REVIEW_PENDING: ['REVIEWED'],
  REVIEWED: ['CLOSED'],
  CLOSED: [],
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

      const currentState: OperationalState = (latestTimeline?.status as OperationalState) || 'REQUESTED';

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
