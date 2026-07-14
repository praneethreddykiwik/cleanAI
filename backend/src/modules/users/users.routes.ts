import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '@/middleware/auth';
import { prisma } from '@/database';

export const userRoutes = Router();

// Profile info query
userRoutes.get('/me', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        customer: user.customer,
        vendor: user.vendor,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch profile' });
  }
});

// Update profile info
userRoutes.patch('/me', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { firstName, lastName, phone, avatar } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
        avatar: avatar || undefined,
      },
    });

    res.status(200).json({
      success: true,
      message: 'User profile updated successfully.',
      data: {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
        avatar: updated.avatar,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update profile' });
  }
});

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

// Addresses
userRoutes.get('/me/addresses', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const customer = await getOrCreateCustomer(userId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer profile not found' });
    }

    const addresses = await prisma.address.findMany({
      where: { customerId: customer.id },
      orderBy: { isDefault: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch addresses' });
  }
});

userRoutes.post('/me/addresses', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const customer = await getOrCreateCustomer(userId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer profile not found' });
    }

    const { label, line1, line2, city, state, pincode, landmark, latitude, longitude, isDefault = false } = req.body;

    if (!label || !line1 || !city || !state || !pincode) {
      return res.status(400).json({ success: false, message: 'Missing address parameters' });
    }

    // If isDefault is true, set others for this customer to false
    if (isDefault) {
      await prisma.address.updateMany({
        where: { customerId: customer.id },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        customerId: customer.id,
        label,
        line1,
        line2,
        city,
        state,
        pincode,
        landmark,
        latitude: latitude ? parseFloat(latitude.toString()) : null,
        longitude: longitude ? parseFloat(longitude.toString()) : null,
        isDefault,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully.',
      data: newAddress,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to add address' });
  }
});

userRoutes.delete('/me/addresses/:id', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const customer = await getOrCreateCustomer(userId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer profile not found' });
    }

    const address = await prisma.address.findFirst({
      where: { id, customerId: customer.id },
    });

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    await prisma.address.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete address' });
  }
});

// Mock/Simple Payments (for storing payment config on user profile)
userRoutes.get('/me/payments', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    data: [
      { id: 'card-1', brand: 'Visa', last4: '4242', expiry: '12/28', isDefault: true }
    ],
  });
});

userRoutes.post('/me/payments', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  res.status(201).json({
    success: true,
    message: 'Payment method registered.',
    data: { id: `card-${Math.random().toString(36).substring(7)}`, ...req.body },
  });
});

userRoutes.delete('/me/payments/:id', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Payment method deleted.',
  });
});
