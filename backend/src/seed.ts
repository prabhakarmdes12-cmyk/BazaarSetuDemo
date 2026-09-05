import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.product.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.user.deleteMany();

  // Create admin
  const admin = await prisma.user.create({
    data: { phone: '9999999999', name: 'Admin', role: 'admin' },
  });
  console.log('Admin created:', admin.phone);

  // Create vendors
  const vendor1 = await prisma.user.create({
    data: { phone: '9876543210', name: 'Ramesh', role: 'vendor' },
  });
  const vendor2 = await prisma.user.create({
    data: { phone: '9876543211', name: 'Suresh', role: 'vendor' },
  });

  // Create shops
  const shop1 = await prisma.shop.create({
    data: {
      ownerId: vendor1.id,
      name: 'Ramesh General Store',
      description: 'Sab kuch milta hai yahan!',
      address: 'Shop No. 5, Main Market, Sector 12',
      phone: '9876543210',
      lat: 28.6139,
      lng: 77.209,
      rating: 4.7,
    },
  });

  const shop2 = await prisma.shop.create({
    data: {
      ownerId: vendor2.id,
      name: 'Suresh Kirana',
      description: 'Ghar ka saaman, sasta aur accha',
      address: 'Near Bus Stand, Sector 8',
      phone: '9876543211',
      lat: 28.62,
      lng: 77.215,
      rating: 4.3,
    },
  });

  console.log('Shops created:', shop1.name, shop2.name);

  // Create products for shop1
  const products1 = await Promise.all([
    prisma.product.create({ data: { shopId: shop1.id, name: 'Basmati Chawal', price: 80, unit: 'kg', category: 'Grains' } }),
    prisma.product.create({ data: { shopId: shop1.id, name: 'Aashirvaad Aata', price: 45, unit: 'kg', category: 'Grains' } }),
    prisma.product.create({ data: { shopId: shop1.id, name: 'Mustard Oil', price: 150, unit: 'L', category: 'Oil' } }),
    prisma.product.create({ data: { shopId: shop1.id, name: 'Sugar', price: 42, unit: 'kg', category: 'Essentials' } }),
    prisma.product.create({ data: { shopId: shop1.id, name: 'Tea (Taj Mahal)', price: 120, unit: 'pack', category: 'Beverages' } }),
    prisma.product.create({ data: { shopId: shop1.id, name: 'Amul Milk', price: 28, unit: 'pcs', category: 'Dairy' } }),
    prisma.product.create({ data: { shopId: shop1.id, name: 'Onion', price: 30, unit: 'kg', category: 'Vegetables' } }),
    prisma.product.create({ data: { shopId: shop1.id, name: 'Potato', price: 25, unit: 'kg', category: 'Vegetables' } }),
  ]);

  // Create products for shop2
  const products2 = await Promise.all([
    prisma.product.create({ data: { shopId: shop2.id, name: 'Sona Masoori Rice', price: 65, unit: 'kg', category: 'Grains' } }),
    prisma.product.create({ data: { shopId: shop2.id, name: 'Chakki Fresh Aata', price: 38, unit: 'kg', category: 'Grains' } }),
    prisma.product.create({ data: { shopId: shop2.id, name: 'Fortune Oil', price: 140, unit: 'L', category: 'Oil' } }),
    prisma.product.create({ data: { shopId: shop2.id, name: 'Tata Salt', price: 22, unit: 'pack', category: 'Essentials' } }),
    prisma.product.create({ data: { shopId: shop2.id, name: 'Red Label Tea', price: 95, unit: 'pack', category: 'Beverages' } }),
    prisma.product.create({ data: { shopId: shop2.id, name: 'Paneer', price: 80, unit: 'pack', category: 'Dairy' } }),
    prisma.product.create({ data: { shopId: shop2.id, name: 'Tomato', price: 35, unit: 'kg', category: 'Vegetables' } }),
  ]);

  console.log(`Products created: ${products1.length} for shop1, ${products2.length} for shop2`);

  // Create customers
  const customer1 = await prisma.user.create({
    data: { phone: '8888888888', name: 'Amit', role: 'customer' },
  });
  const customer2 = await prisma.user.create({
    data: { phone: '7777777777', name: 'Priya', role: 'customer' },
  });

  // Create chat
  const chat1 = await prisma.chat.create({
    data: { customerId: customer1.id, shopId: shop1.id },
  });

  await prisma.message.createMany({
    data: [
      { chatId: chat1.id, senderId: customer1.id, senderRole: 'customer', content: 'Namaste! Kya chawal available hai?', type: 'TEXT' },
      { chatId: chat1.id, senderId: vendor1.id, senderRole: 'vendor', content: 'Haan ji, Basmati Chawal hai. ₹80/kg', type: 'TEXT' },
      { chatId: chat1.id, senderId: customer1.id, senderRole: 'customer', content: '2kg pack kar dijiye', type: 'TEXT' },
    ],
  });

  // Create an order
  const order1 = await prisma.order.create({
    data: {
      customerId: customer1.id,
      shopId: shop1.id,
      totalAmount: 210,
      status: 'completed',
      items: {
        create: [
          { productId: products1[0].id, productName: 'Basmati Chawal', quantity: 2, price: 80 },
          { productId: products1[1].id, productName: 'Aashirvaad Aata', quantity: 1, price: 45 },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      customerId: customer2.id,
      shopId: shop2.id,
      totalAmount: 143,
      status: 'pending',
      items: {
        create: [
          { productId: products2[0].id, productName: 'Sona Masoori Rice', quantity: 1, price: 65 },
          { productId: products2[3].id, productName: 'Tata Salt', quantity: 1, price: 22 },
          { productId: products2[4].id, productName: 'Red Label Tea', quantity: 1, price: 95 },
        ],
      },
    },
  });

  console.log('Orders created');
  console.log('\nSeed completed!');
  console.log('\n--- Test Accounts ---');
  console.log('Admin:   9999999999');
  console.log('Vendor1: 9876543210 (Ramesh)');
  console.log('Vendor2: 9876543211 (Suresh)');
  console.log('Customer: 8888888888 (Amit)');
  console.log('Customer: 7777777777 (Priya)');
  console.log('OTP for all: 1234');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
