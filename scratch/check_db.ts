import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const services = await prisma.service.findMany();
  console.log('Services in Database:', services.map(s => ({ id: s.id, name: s.name, slug: s.slug })));
  
  const vendors = await prisma.vendor.findMany();
  console.log('Vendors in Database:', vendors.map(v => ({ id: v.id, businessName: v.businessName })));

  const vendorServices = await prisma.vendorService.findMany();
  console.log('VendorServices mappings:', vendorServices);
}

main().catch(console.error).finally(() => prisma.$disconnect());
