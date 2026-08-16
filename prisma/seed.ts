import { PrismaClient, UserRole, VendorStatus, AgentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding production-ready database tables...');

  // 1. Delete existing records to clean up (in correct order of dependency)
  await prisma.supportTicket.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.vendorService.deleteMany({});
  await prisma.agent.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.user.deleteMany({ where: { email: { in: ['vendor1@cleanai.com', 'vendor2@cleanai.com', 'agent1@cleanai.com', 'agent2@cleanai.com'] } } });

  // 2. Create the 12 production services
  const servicesData = [
    { name: 'Kitchen Cleaning', slug: 'kitchen-cleaning', category: 'Cleaning', icon: '🍳', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800', basePrice: 499, isActive: true, description: 'Deep cleaning for kitchen' },
    { name: 'Bathroom Cleaning', slug: 'bathroom-cleaning', category: 'Cleaning', icon: '🚿', image: 'https://images.unsplash.com/photo-1620626011160-9928f1b2b69a?w=800', basePrice: 299, isActive: true, description: 'Deep cleaning for bathroom' },
    { name: 'Deep Cleaning', slug: 'deep-cleaning', category: 'Cleaning', icon: '✨', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800', basePrice: 1499, isActive: true, description: 'Deep cleaning for house' },
    { name: 'Painting', slug: 'painting', category: 'Home Improvement', icon: '🎨', image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800', basePrice: 2999, isActive: true, description: 'Painting for walls' },
    { name: 'Electrical', slug: 'electrical', category: 'Repair', icon: '⚡', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800', basePrice: 399, isActive: true, description: 'Electrical repairs' },
    { name: 'Plumbing', slug: 'plumbing', category: 'Repair', icon: '🔧', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800', basePrice: 349, isActive: true, description: 'Plumbing services' },
    { name: 'AC Service', slug: 'ac-service', category: 'Appliance', icon: '❄️', image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800', basePrice: 599, isActive: true, description: 'AC servicing' },
    { name: 'Pest Control', slug: 'pest-control', category: 'Home Care', icon: '🐛', image: 'https://images.unsplash.com/photo-1587324438673-56c527027d14?w=800', basePrice: 799, isActive: true, description: 'Pest control services' },
    { name: 'Laundry', slug: 'laundry', category: 'Home Care', icon: '👕', image: 'https://images.unsplash.com/photo-1545173168-9f1947eebd01?w=800', basePrice: 249, isActive: true, description: 'Laundry services' },
    { name: 'Gardening', slug: 'gardening', category: 'Outdoor', icon: '🌿', image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800', basePrice: 599, isActive: true, description: 'Gardening services' },
    { name: 'Car Wash', slug: 'car-wash', category: 'Vehicle', icon: '🚗', image: 'https://images.unsplash.com/photo-1520340356584-f9917d1ecc6f?w=800', basePrice: 399, isActive: true, description: 'Car wash services' },
    { name: 'Sofa Cleaning', slug: 'sofa-cleaning', category: 'Cleaning', icon: '🛋️', image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800', basePrice: 699, isActive: true, description: 'Sofa cleaning services' }
  ];

  const dbServices = [];
  for (const s of servicesData) {
    const created = await prisma.service.create({ data: s });
    dbServices.push(created);
  }
  console.log(`Successfully created ${dbServices.length} production services.`);

  // 3. Create Users for Vendors
  const passwordHash = await bcrypt.hash('CleanAIPassword123!', 10);

  const vendorUser1 = await prisma.user.create({
    data: {
      email: 'vendor1@cleanai.com',
      phone: '+919999999911',
      firstName: 'Apex Cleaners',
      lastName: 'Manager',
      passwordHash,
      role: UserRole.VENDOR,
      isEmailVerified: true,
      isPhoneVerified: true,
    }
  });

  const vendorUser2 = await prisma.user.create({
    data: {
      email: 'vendor2@cleanai.com',
      phone: '+919999999922',
      firstName: 'Bengaluru Express',
      lastName: 'Services',
      passwordHash,
      role: UserRole.VENDOR,
      isEmailVerified: true,
      isPhoneVerified: true,
    }
  });

  // 4. Create Vendors (isVerified = true, status = APPROVED)
  const vendor1 = await prisma.vendor.create({
    data: {
      userId: vendorUser1.id,
      businessName: 'Apex Pro Services',
      businessDescription: 'Expert home deep cleaning and maintenance services in Bengaluru.',
      rating: 4.8,
      status: VendorStatus.APPROVED,
      isVerified: true,
    }
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      userId: vendorUser2.id,
      businessName: 'Bengaluru Premium Services',
      businessDescription: 'Elite plumbing, electrical, and appliance care partners.',
      rating: 4.9,
      status: VendorStatus.APPROVED,
      isVerified: true,
    }
  });

  console.log('Seeded vendors successfully.');

  // 5. Map services to vendors in vendor_services
  for (const s of dbServices) {
    await prisma.vendorService.create({
      data: {
        vendorId: vendor1.id,
        serviceId: s.id,
        price: s.basePrice,
        isActive: true
      }
    });

    await prisma.vendorService.create({
      data: {
        vendorId: vendor2.id,
        serviceId: s.id,
        price: s.basePrice,
        isActive: true
      }
    });
  }
  console.log('Seeded vendor_services mappings successfully.');

  // 6. Create Users for Agents (Technicians)
  const agentUser1 = await prisma.user.create({
    data: {
      email: 'agent1@cleanai.com',
      phone: '+919999999933',
      firstName: 'Ramesh',
      lastName: 'Kumar',
      passwordHash,
      role: UserRole.AGENT,
      isEmailVerified: true,
      isPhoneVerified: true,
    }
  });

  const agentUser2 = await prisma.user.create({
    data: {
      email: 'agent2@cleanai.com',
      phone: '+919999999944',
      firstName: 'Suresh',
      lastName: 'Singh',
      passwordHash,
      role: UserRole.AGENT,
      isEmailVerified: true,
      isPhoneVerified: true,
    }
  });

  // 7. Create Agents (status = AVAILABLE)
  await prisma.agent.create({
    data: {
      userId: agentUser1.id,
      vendorId: vendor1.id,
      status: AgentStatus.AVAILABLE,
    }
  });

  await prisma.agent.create({
    data: {
      userId: agentUser2.id,
      vendorId: vendor2.id,
      status: AgentStatus.AVAILABLE,
    }
  });

  console.log('Seeded available agents successfully.');
  console.log('Database seeding complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
