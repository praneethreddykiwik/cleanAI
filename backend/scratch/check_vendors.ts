import { prisma } from '../src/database';

async function checkVendors() {
  const vendors = await prisma.vendor.findMany({
    include: {
      vendorServices: {
        include: { service: true }
      }
    }
  });
  console.log(JSON.stringify(vendors.map(v => ({
    name: v.businessName,
    services: v.vendorServices.map(vs => vs.service.name)
  })), null, 2));
  process.exit(0);
}

checkVendors();
