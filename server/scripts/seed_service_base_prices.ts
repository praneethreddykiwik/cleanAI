import { prisma } from '../database';

async function seedServiceBasePrices() {
  console.log('====================================================');
  console.log('🌱 UPDATING SERVICE-SPECIFIC CONFIGURABLE BASE PRICES');
  console.log('====================================================\n');

  const basePrices: Record<string, number> = {
    'Bathroom Cleaning': 299,
    'Kitchen Cleaning': 499,
    'Sofa Cleaning': 399,
    'Mattress Cleaning': 349,
    'AC Service': 599,
    'AC Service & Repair': 599,
    'Bike Wash': 199,
    'Car Wash': 399,
    'Premium Bike & Car Wash': 399,
    'Deep Cleaning': 999,
    'Deep Home Cleaning': 999,
    'Full Home Cleaning': 1499,
    'Painting': 1499,
    'Interior & Exterior Painting': 1499,
    'Electrical': 399,
    'Electrical Repairs': 399,
    'Plumbing': 349,
    'Plumbing Services': 349,
    'Pest Control': 799,
    'Herbal Pest Control': 799,
    'Gardening': 599,
    'Gardening & Lawn Care': 599,
    'Griha Pravesh & Wedding Cleaning': 1999,
    'Post-Renovation Debris Clean': 2499,
    'Water Tank & Sump Clean': 899,
    'Office & Facility Cleaning': 2999,
    'Move-In / Move-Out Clean': 1799,
    'Festival & Seasonal Deep Clean': 1299,
  };

  for (const [name, price] of Object.entries(basePrices)) {
    const existing = await prisma.service.findFirst({
      where: { name: { contains: name, mode: 'insensitive' } },
    });

    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: { basePrice: price },
      });
      console.log(`✅ Updated "${existing.name}" base price to ₹${price}`);
    } else {
      console.log(`ℹ️ Service "${name}" not in DB yet (will be populated on catalog load)`);
    }
  }

  console.log('\n🎉 ALL SERVICE BASE PRICES UPDATED SUCCESSFULLY!');
  process.exit(0);
}

seedServiceBasePrices().catch((err) => {
  console.error('❌ Base price seed error:', err);
  process.exit(1);
});
