import { Router } from 'express';
import { prisma } from '../../database';

export const serviceRoutes = Router();

const DEFAULT_SERVICES = [
  {
    name: 'Kitchen Cleaning',
    slug: 'kitchen-cleaning',
    description: 'Professional deep cleaning for your kitchen, including appliances, countertops, and cabinets.',
    category: 'Cleaning',
    icon: '🍳',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=60',
    basePrice: 499,
    isActive: true,
    sortOrder: 1,
  },
  {
    name: 'Bathroom Cleaning',
    slug: 'bathroom-cleaning',
    description: 'Thorough sanitization and cleaning of bathrooms, tiles, and fixtures.',
    category: 'Cleaning',
    icon: '🚿',
    image: 'https://images.unsplash.com/photo-1620626011160-9928f1b2b69a?w=800&auto=format&fit=crop&q=60',
    basePrice: 299,
    isActive: true,
    sortOrder: 2,
  },
  {
    name: 'Deep Cleaning',
    slug: 'deep-cleaning',
    description: 'Complete home deep cleaning service covering every corner of your space.',
    category: 'Cleaning',
    icon: '✨',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=60',
    basePrice: 1499,
    isActive: true,
    sortOrder: 3,
  },
  {
    name: 'Painting',
    slug: 'painting',
    description: 'Professional interior and exterior painting services for your home.',
    category: 'Home Improvement',
    icon: '🎨',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=60',
    basePrice: 2999,
    isActive: true,
    sortOrder: 4,
  },
  {
    name: 'Electrical',
    slug: 'electrical',
    description: 'Expert electricians for repairs, installations, and safety inspections.',
    category: 'Repair',
    icon: '⚡',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=60',
    basePrice: 399,
    isActive: true,
    sortOrder: 5,
  },
  {
    name: 'Plumbing',
    slug: 'plumbing',
    description: 'Fix leaks, blockages, and plumbing installations by certified plumbers.',
    category: 'Repair',
    icon: '🔧',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=60',
    basePrice: 349,
    isActive: true,
    sortOrder: 6,
  },
  {
    name: 'AC Service',
    slug: 'ac-service',
    description: 'AC servicing, deep cleaning, gas refill, and repair services.',
    category: 'Appliance',
    icon: '❄️',
    image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&auto=format&fit=crop&q=60',
    basePrice: 599,
    isActive: true,
    sortOrder: 7,
  },
  {
    name: 'Pest Control',
    slug: 'pest-control',
    description: 'Professional pest control treatments for cockroaches, ants, rodents, and more.',
    category: 'Home Care',
    icon: '🐛',
    image: 'https://images.unsplash.com/photo-1587324438673-56c527027d14?w=800&auto=format&fit=crop&q=60',
    basePrice: 799,
    isActive: true,
    sortOrder: 8,
  },
  {
    name: 'Laundry',
    slug: 'laundry',
    description: 'Wash, dry, fold, and iron services for all your clothing and linens.',
    category: 'Home Care',
    icon: '👕',
    image: 'https://images.unsplash.com/photo-1545173168-9f1947eebd01?w=800&auto=format&fit=crop&q=60',
    basePrice: 249,
    isActive: true,
    sortOrder: 9,
  },
  {
    name: 'Gardening',
    slug: 'gardening',
    description: 'Garden maintenance, pruning, planting, and lawn care services.',
    category: 'Outdoor',
    icon: '🌿',
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=60',
    basePrice: 599,
    isActive: true,
    sortOrder: 10,
  },
  {
    name: 'Car Wash',
    slug: 'car-wash',
    description: 'Doorstep car washing, interior cleaning, and detailing services.',
    category: 'Vehicle',
    icon: '🚗',
    image: 'https://images.unsplash.com/photo-1520340356584-f9917d1ecc6f?w=800&auto=format&fit=crop&q=60',
    basePrice: 399,
    isActive: true,
    sortOrder: 11,
  },
  {
    name: 'Sofa Cleaning',
    slug: 'sofa-cleaning',
    description: 'Professional sofa and upholstery cleaning to remove stains and odors.',
    category: 'Cleaning',
    icon: '🛋️',
    image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&auto=format&fit=crop&q=60',
    basePrice: 699,
    isActive: true,
    sortOrder: 12,
  }
];

// Services catalog lists
serviceRoutes.get('/', async (req, res) => {
  try {
    let services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Auto-seed if catalog is empty
    if (services.length === 0) {
      await prisma.service.createMany({
        data: DEFAULT_SERVICES,
        skipDuplicates: true,
      });
      services = await prisma.service.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    }

    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch services' });
  }
});

// Single service lookup
serviceRoutes.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const service = await prisma.service.findUnique({
      where: { slug },
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch service' });
  }
});
