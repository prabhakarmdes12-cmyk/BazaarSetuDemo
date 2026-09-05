import { PrismaClient } from '@prisma/client';
import { getPilotConfig } from './lib/config';

const prisma = new PrismaClient();
const db = prisma as any;

const pilotConfig = getPilotConfig();
const locality = {
  name: pilotConfig.localityName,
  city: 'Ranchi',
  state: 'Jharkhand',
  pincodes: pilotConfig.allowedPincodes,
  centerLat: pilotConfig.centerLat,
  centerLng: pilotConfig.centerLng,
  radiusKm: pilotConfig.radiusKm,
};

interface PilotUserInput {
  phone: string;
  name: string;
  role: 'vendor' | 'customer' | 'admin';
  address?: string;
  locality?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
}

interface PilotShopInput {
  ownerId: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  rating: number;
  upiId: string;
}

interface PilotProductInput {
  name: string;
  price: number;
  unit: string;
  category: string;
  description?: string;
}

async function upsertUser(input: PilotUserInput) {
  const data = {
    phone: input.phone,
    name: input.name,
    role: input.role,
    privacyAcceptedAt: new Date(),
    address: input.address || '',
    locality: input.locality || locality.name,
    pincode: input.pincode || locality.pincodes[0] || '',
    lat: input.lat,
    lng: input.lng,
  };

  const existing = await db.user.findUnique({ where: { phone: input.phone } });
  if (existing) {
    return db.user.update({ where: { id: existing.id }, data });
  }
  return db.user.create({ data });
}

async function upsertShop(input: PilotShopInput) {
  const existing = await prisma.shop.findUnique({ where: { ownerId: input.ownerId } });
  const data = {
    ownerId: input.ownerId,
    name: input.name,
    description: input.description,
    address: input.address,
    phone: input.phone,
    lat: input.lat,
    lng: input.lng,
    rating: input.rating,
    upiId: input.upiId,
    isActive: true,
  };

  if (existing) return prisma.shop.update({ where: { id: existing.id }, data });
  return prisma.shop.create({ data });
}

async function upsertProduct(shopId: string, input: PilotProductInput) {
  const existing = await prisma.product.findFirst({ where: { shopId, name: input.name } });
  const data = {
    shopId,
    name: input.name,
    price: input.price,
    unit: input.unit,
    category: input.category,
    description: input.description || `${input.name} — ${locality.name} pilot SKU`,
    isAvailable: true,
  };

  if (existing) return prisma.product.update({ where: { id: existing.id }, data });
  return prisma.product.create({ data });
}

async function upsertPilotLedger(input: {
  customerId: string;
  shopId: string;
  creditLimit: number;
  credits: Array<{ amount: number; note: string }>;
  payments?: Array<{ amount: number; note: string }>;
}) {
  const totalDue = input.credits.reduce((sum, credit) => sum + credit.amount, 0);
  const totalPaid = (input.payments || []).reduce((sum, payment) => sum + payment.amount, 0);
  const ledger = await prisma.udharLedger.upsert({
    where: { customerId_shopId: { customerId: input.customerId, shopId: input.shopId } },
    create: {
      customerId: input.customerId,
      shopId: input.shopId,
      creditLimit: input.creditLimit,
      totalDue,
      totalPaid,
      lastUpdated: new Date(),
    },
    update: {
      creditLimit: input.creditLimit,
      totalDue,
      totalPaid,
      lastUpdated: new Date(),
    },
  });

  // Keep the pilot script idempotent for demo databases.
  await prisma.udharEntry.deleteMany({ where: { ledgerId: ledger.id } });
  await prisma.udharEntry.createMany({
    data: [
      ...input.credits.map((credit) => ({ ledgerId: ledger.id, type: 'CREDIT', amount: credit.amount, note: `Pilot seed: ${credit.note}` })),
      ...(input.payments || []).map((payment) => ({ ledgerId: ledger.id, type: 'PAYMENT', amount: payment.amount, note: `Pilot seed: ${payment.note}` })),
    ],
  });

  return ledger;
}

async function seedProducts(shopId: string, products: PilotProductInput[]) {
  for (const product of products) {
    await upsertProduct(shopId, product);
  }
}

async function seedPilot() {
  console.log('Seeding BazaarSetu pilot locality...');
  console.log(`${locality.name} (${locality.pincodes.join(', ')}) radius ${locality.radiusKm}km`);

  const admin = await upsertUser({ phone: '9999900000', name: 'Chiti Pilot Operator', role: 'admin' });
  const guptaOwner = await upsertUser({ phone: '9876501001', name: 'Rakesh Gupta', role: 'vendor' });
  const sabziOwner = await upsertUser({ phone: '9876501002', name: 'Sanjay Mahto', role: 'vendor' });
  const medicosOwner = await upsertUser({ phone: '9876501003', name: 'Anil Verma', role: 'vendor' });

  const guptaShop = await upsertShop({
    ownerId: guptaOwner.id,
    name: 'Gupta General Store',
    description: 'Grocery / Kirana pilot shop for daily household needs.',
    address: 'Shop 12, Ashok Nagar Road No. 4, Ranchi, Jharkhand 834002',
    phone: '9876501001',
    lat: 23.3504,
    lng: 85.3189,
    rating: 4.8,
    upiId: 'guptageneral@upi',
  });

  const sabziShop = await upsertShop({
    ownerId: sabziOwner.id,
    name: 'Kisan Fresh Sabzi Mandi',
    description: 'Vegetables and fruits with variable-weight merchant confirmation.',
    address: 'Kanke Road Fresh Market, Ranchi, Jharkhand 834008',
    phone: '9876501002',
    lat: 23.3999,
    lng: 85.3378,
    rating: 4.6,
    upiId: 'kisanfresh@upi',
  });

  const medicosShop = await upsertShop({
    ownerId: medicosOwner.id,
    name: 'Verma Medicos',
    description: 'Chemist and daily essentials pilot shop.',
    address: 'Near Rock Garden More, Kanke Road, Ranchi, Jharkhand 834008',
    phone: '9876501003',
    lat: 23.3943,
    lng: 85.3297,
    rating: 4.7,
    upiId: 'vermamedicos@upi',
  });

  await seedProducts(guptaShop.id, [
    { name: 'Aashirvaad Atta', price: 44, unit: 'kg', category: 'Grains' },
    { name: 'India Gate Basmati Rice', price: 125, unit: 'kg', category: 'Grains' },
    { name: 'Sona Masoori Rice', price: 62, unit: 'kg', category: 'Grains' },
    { name: 'Tata Sampann Toor Dal', price: 168, unit: 'kg', category: 'Pulses' },
    { name: 'Masoor Dal', price: 98, unit: 'kg', category: 'Pulses' },
    { name: 'Chana Dal', price: 86, unit: 'kg', category: 'Pulses' },
    { name: 'Tata Salt', price: 24, unit: 'pack', category: 'Essentials' },
    { name: 'Sugar', price: 44, unit: 'kg', category: 'Essentials' },
    { name: 'Fortune Sunflower Oil', price: 155, unit: 'L', category: 'Oil' },
    { name: 'Mustard Oil', price: 148, unit: 'L', category: 'Oil' },
    { name: 'Red Label Tea', price: 135, unit: 'pack', category: 'Beverages' },
    { name: 'Bru Instant Coffee', price: 170, unit: 'pack', category: 'Beverages' },
    { name: 'Maggi Noodles', price: 14, unit: 'pack', category: 'Snacks' },
    { name: 'Parle-G Biscuits', price: 10, unit: 'pack', category: 'Snacks' },
    { name: 'Surf Excel Detergent', price: 128, unit: 'pack', category: 'Home Care' },
    { name: 'Vim Dishwash Bar', price: 10, unit: 'piece', category: 'Home Care' },
    { name: 'Dettol Soap', price: 38, unit: 'piece', category: 'Personal Care' },
    { name: 'Colgate Toothpaste', price: 58, unit: 'piece', category: 'Personal Care' },
    { name: 'Amul Milk', price: 28, unit: 'packet', category: 'Dairy' },
    { name: 'Good Knight Liquid', price: 82, unit: 'piece', category: 'Home Care' },
  ]);

  await seedProducts(sabziShop.id, [
    { name: 'Tomato', price: 34, unit: 'kg', category: 'Vegetables', description: 'Variable weight — final weight confirmed by merchant.' },
    { name: 'Potato', price: 28, unit: 'kg', category: 'Vegetables', description: 'Variable weight — final weight confirmed by merchant.' },
    { name: 'Onion', price: 32, unit: 'kg', category: 'Vegetables' },
    { name: 'Carrot', price: 54, unit: 'kg', category: 'Vegetables' },
    { name: 'Cauliflower', price: 38, unit: 'piece', category: 'Vegetables' },
    { name: 'Cabbage', price: 30, unit: 'piece', category: 'Vegetables' },
    { name: 'Spinach', price: 18, unit: 'bunch', category: 'Vegetables' },
    { name: 'Coriander', price: 12, unit: 'bunch', category: 'Vegetables' },
    { name: 'Green Chilli', price: 70, unit: 'kg', category: 'Vegetables' },
    { name: 'Ginger', price: 120, unit: 'kg', category: 'Vegetables' },
    { name: 'Garlic', price: 150, unit: 'kg', category: 'Vegetables' },
    { name: 'Banana', price: 48, unit: 'dozen', category: 'Fruits' },
    { name: 'Apple', price: 160, unit: 'kg', category: 'Fruits' },
    { name: 'Orange', price: 90, unit: 'kg', category: 'Fruits' },
    { name: 'Grapes', price: 110, unit: 'kg', category: 'Fruits' },
    { name: 'Pomegranate', price: 180, unit: 'kg', category: 'Fruits' },
  ]);

  await seedProducts(medicosShop.id, [
    { name: 'Paracetamol 500mg', price: 15, unit: 'strip', category: 'Medicines' },
    { name: 'ORS Sachet', price: 22, unit: 'sachet', category: 'Medicines' },
    { name: 'Crocin Syrup', price: 48, unit: 'bottle', category: 'Medicines' },
    { name: 'Crepe Bandage', price: 95, unit: 'piece', category: 'First Aid' },
    { name: 'Dettol Antiseptic Liquid', price: 78, unit: 'bottle', category: 'First Aid' },
    { name: 'Hand Sanitizer', price: 55, unit: 'bottle', category: 'Hygiene' },
    { name: 'Moov Pain Relief', price: 120, unit: 'tube', category: 'Medicines' },
    { name: 'Vicks VapoRub', price: 99, unit: 'piece', category: 'Medicines' },
    { name: 'Baby Diapers', price: 310, unit: 'pack', category: 'Daily Essentials' },
    { name: 'Sanitary Pads', price: 95, unit: 'pack', category: 'Daily Essentials' },
    { name: 'Glucon-D', price: 165, unit: 'pack', category: 'Nutrition' },
    { name: 'Cotton Roll', price: 45, unit: 'piece', category: 'First Aid' },
    { name: 'Digital Thermometer', price: 180, unit: 'piece', category: 'Devices' },
    { name: 'Disposable Mask', price: 8, unit: 'piece', category: 'Hygiene' },
    { name: 'Handwash', price: 82, unit: 'bottle', category: 'Hygiene' },
  ]);

  const customerA = await upsertUser({
    phone: '9000001001',
    name: 'Priya Sinha',
    role: 'customer',
    address: 'House 24, Road 3, Ashok Nagar, Ranchi, Jharkhand 834002',
    locality: locality.name,
    pincode: '834002',
    lat: 23.3511,
    lng: 85.3212,
  });

  const customerB = await upsertUser({
    phone: '9000001002',
    name: 'Amit Kumar',
    role: 'customer',
    address: 'Flat 2B, CMPDI Gate ke paas, Kanke Road, Ranchi, Jharkhand 834008',
    locality: locality.name,
    pincode: '834008',
    lat: 23.3988,
    lng: 85.3354,
  });

  await upsertPilotLedger({
    customerId: customerA.id,
    shopId: guptaShop.id,
    creditLimit: 2500,
    credits: [
      { amount: 640, note: 'monthly grocery carry-forward' },
      { amount: 210, note: 'milk and household top-up' },
    ],
    payments: [{ amount: 300, note: 'cash collection' }],
  });

  await upsertPilotLedger({
    customerId: customerB.id,
    shopId: sabziShop.id,
    creditLimit: 1200,
    credits: [{ amount: 420, note: 'weekly sabzi basket' }],
    payments: [{ amount: 100, note: 'UPI partial payment' }],
  });

  await upsertPilotLedger({
    customerId: customerB.id,
    shopId: medicosShop.id,
    creditLimit: 1500,
    credits: [{ amount: 360, note: 'chemist essentials' }],
  });

  for (const shop of [guptaShop, sabziShop, medicosShop]) {
    for (const customer of [customerA, customerB]) {
      await prisma.chat.upsert({
        where: { customerId_shopId: { customerId: customer.id, shopId: shop.id } },
        create: { customerId: customer.id, shopId: shop.id },
        update: { updatedAt: new Date() },
      });
    }
  }

  await prisma.operationalEventLog.upsert({
    where: { eventId: 'evt_pilot_seed_ashok_nagar_kanke_road_v1' },
    create: {
      eventId: 'evt_pilot_seed_ashok_nagar_kanke_road_v1',
      eventType: 'BAZAAR.PILOT_LOCALITY_SEEDED',
      version: '1.0.0',
      payload: JSON.stringify({ locality, admin: admin.id, shops: [guptaShop.id, sabziShop.id, medicosShop.id], customers: [customerA.id, customerB.id] }),
      occurredAt: new Date(),
    },
    update: {
      payload: JSON.stringify({ locality, admin: admin.id, shops: [guptaShop.id, sabziShop.id, medicosShop.id], customers: [customerA.id, customerB.id] }),
      occurredAt: new Date(),
    },
  });

  console.log('\nPilot seed completed.');
  console.log('\n--- Pilot locality ---');
  console.log(`${locality.name}, PIN ${locality.pincodes.join('/')} — ${locality.radiusKm}km radius`);
  console.log('\n--- Pilot operator ---');
  console.log('Admin: 9999900000 / Chiti Pilot Operator');
  console.log('\n--- Pilot shops ---');
  console.log(`Vendor: 9876501001 / Gupta General Store / ${guptaShop.upiId}`);
  console.log(`Vendor: 9876501002 / Kisan Fresh Sabzi Mandi / ${sabziShop.upiId}`);
  console.log(`Vendor: 9876501003 / Verma Medicos / ${medicosShop.upiId}`);
  console.log('\n--- Test customers ---');
  console.log('Customer: 9000001001 / Priya Sinha / Ashok Nagar / active Gupta udhaar');
  console.log('Customer: 9000001002 / Amit Kumar / Kanke Road / active Sabzi + Medicos udhaar');
  console.log('OTP for all pilot accounts in dev/test: 1234');
}

seedPilot()
  .catch((err) => {
    console.error('Pilot seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
