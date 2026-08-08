import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '@/middleware/auth';
import { prisma } from '@/database';
import { MediaStorageService } from '@/config/cloudinary';

export const userRoutes = Router();

// Expose direct media upload endpoint to Cloudinary
userRoutes.post('/upload', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileContent } = req.body;
    if (!fileContent) {
      return res.status(400).json({ success: false, message: 'Missing fileContent in request body' });
    }
    const uploadResult = await MediaStorageService.uploadFile(fileContent, 'cleanai_uploads');
    res.status(200).json({
      success: true,
      data: {
        url: uploadResult.url,
        publicId: uploadResult.publicId
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'File upload failed' });
  }
});

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

// Payment history — pulled from real Payment records linked to the customer
userRoutes.get('/me/payments', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer profile not found' });

    const payments = await prisma.payment.findMany({
      where: { booking: { customerId: customer.id } },
      include: { booking: { select: { bookingNumber: true, totalAmount: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.status(200).json({ success: true, data: payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch payment history' });
  }
});

// Wallet balance
userRoutes.get('/me/wallet', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Wallet is linked to Customer, not directly to User
    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer profile not found' });

    let wallet = await prisma.wallet.findUnique({
      where: { customerId: customer.id },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });

    if (!wallet) {
      // Auto-create wallet on first access
      wallet = await prisma.wallet.create({
        data: { customerId: customer.id, balance: 0 },
        include: { transactions: true },
      });
    }

    res.status(200).json({ success: true, data: wallet });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch wallet' });
  }
});

// Preferences Endpoints
userRoutes.get('/me/preferences', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const customer = await getOrCreateCustomer(userId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer profile not found' });

    const defaultPreferences = {
      aiHistoryConsent: true,
      smartRecommendations: true,
      whatsappUpdates: true,
      emailAlerts: true,
      promoEmails: false,
      twoFactorAuth: false,
      currency: 'INR',
    };

    const currentPrefs = (customer.preferences && typeof customer.preferences === 'object')
      ? { ...defaultPreferences, ...(customer.preferences as object) }
      : defaultPreferences;

    res.status(200).json({ success: true, data: currentPrefs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch preferences' });
  }
});

userRoutes.patch('/me/preferences', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const customer = await getOrCreateCustomer(userId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer profile not found' });

    const newPreferences = req.body;
    const updatedPreferences = {
      ...((customer.preferences as object) || {}),
      ...newPreferences,
    };

    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: { preferences: updatedPreferences },
    });

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully.',
      data: updatedCustomer.preferences,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update preferences' });
  }
});

// Change Password Endpoint
userRoutes.post('/me/change-password', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const bcrypt = await import('bcryptjs');
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to change password' });
  }
});

// Data Export Endpoint
userRoutes.get('/me/export-data', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customer: {
          include: {
            bookings: true,
            addresses: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=cleanai_archive_${userId}.json`);
    res.status(200).json({
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
      customerProfile: user.customer,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to export data' });
  }
});
