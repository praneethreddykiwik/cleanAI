import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '@/middleware/auth';
import { prisma } from '@/database';
import { SocketService } from '@/config/socket';

export const locationRoutes = Router();

locationRoutes.post('/telemetry', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { bookingId, latitude, longitude, heading, speed, accuracy } = req.body;

    if (!latitude || !longitude || !bookingId) {
      return res.status(400).json({ success: false, message: 'Missing telemetry tracking coordinates.' });
    }

    // Resolve active agent profile from userId
    const agent = await prisma.agent.findUnique({
      where: { userId },
    });

    if (!agent) {
      return res.status(403).json({ success: false, message: 'Only active technicians can submit telemetry packets.' });
    }

    // Upsert AgentLocation coordinates
    const agentLocation = await prisma.agentLocation.upsert({
      where: { agentId: agent.id },
      create: {
        agentId: agent.id,
        latitude: parseFloat(latitude.toString()),
        longitude: parseFloat(longitude.toString()),
        heading: heading ? parseFloat(heading.toString()) : null,
        speed: speed ? parseFloat(speed.toString()) : null,
        accuracy: accuracy ? parseFloat(accuracy.toString()) : null,
      },
      update: {
        latitude: parseFloat(latitude.toString()),
        longitude: parseFloat(longitude.toString()),
        heading: heading ? parseFloat(heading.toString()) : null,
        speed: speed ? parseFloat(speed.toString()) : null,
        accuracy: accuracy ? parseFloat(accuracy.toString()) : null,
        lastUpdated: new Date(),
      },
    });

    // Broadcast location telemetry package to booking socket listeners
    SocketService.emitToRoom(`booking:${bookingId}`, 'location.updated', {
      agentId: agent.id,
      latitude: agentLocation.latitude,
      longitude: agentLocation.longitude,
      heading: agentLocation.heading,
      speed: agentLocation.speed,
    });

    res.status(200).json({
      success: true,
      message: 'Telemetry coordinates stored and broadcasted.',
      data: agentLocation,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Telemetry logging failed.' });
  }
});
export default locationRoutes;
