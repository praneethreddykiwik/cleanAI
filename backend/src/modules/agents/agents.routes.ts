import { Router, Response } from 'express';
import { authMiddleware, authorizeRoles, AuthenticatedRequest } from '../../middleware/auth';
import { prisma } from '../../database';
import bcrypt from 'bcryptjs';

export const agentRoutes = Router();

// Agents list for a Vendor
agentRoutes.get('/', authMiddleware as any, authorizeRoles('VENDOR', 'ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (req.user?.role === 'ADMIN') {
      const allAgents = await prisma.agent.findMany({
        include: {
          user: true,
          vendor: true,
        },
      });
      return res.status(200).json({ success: true, data: allAgents });
    }

    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const agents = await prisma.agent.findMany({
      where: { vendorId: vendor.id },
      include: {
        user: true,
      },
    });

    // Map to expected structure
    const mapped = agents.map((a) => ({
      id: a.id,
      name: `${a.user.firstName} ${a.user.lastName}`,
      phone: a.user.phone,
      email: a.user.email,
      rating: a.rating,
      status: a.status,
      skills: a.skills,
    }));

    res.status(200).json({
      success: true,
      data: mapped,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch agents' });
  }
});

// Add new Agent (Vendor registers agent)
agentRoutes.post('/', authMiddleware as any, authorizeRoles('VENDOR') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const { email, phone, firstName, lastName, password, skills = [] } = req.body;

    if (!email || !phone || !firstName || !lastName || !password) {
      return res.status(400).json({ success: false, message: 'Missing required registration fields (email, phone, firstName, lastName, password)' });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Email or phone already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newAgent = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          phone,
          firstName,
          lastName,
          passwordHash,
          role: 'AGENT',
          isActive: true,
        },
      });

      const agentProfile = await tx.agent.create({
        data: {
          userId: createdUser.id,
          vendorId: vendor.id,
          status: 'AVAILABLE',
          skills,
        },
        include: {
          user: true,
        },
      });

      return agentProfile;
    });

    res.status(201).json({
      success: true,
      message: 'New agent registered successfully.',
      data: {
        id: newAgent.id,
        name: `${newAgent.user.firstName} ${newAgent.user.lastName}`,
        phone: newAgent.user.phone,
        email: newAgent.user.email,
        rating: newAgent.rating,
        status: newAgent.status,
        skills: newAgent.skills,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to register agent' });
  }
});

// Delete Agent (Vendor deletes agent)
agentRoutes.delete('/:id', authMiddleware as any, authorizeRoles('VENDOR') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const agent = await prisma.agent.findFirst({
      where: { id, vendorId: vendor.id },
    });

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    // Cascade delete: user table will cascade delete agent profile
    await prisma.user.delete({
      where: { id: agent.userId },
    });

    res.status(200).json({
      success: true,
      message: 'Agent profile removed from vendor registry successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to remove agent' });
  }
});
