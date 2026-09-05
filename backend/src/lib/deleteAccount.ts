import { Prisma } from '@prisma/client';

// Deletes every trace of a user's personal data inside a single transaction
// (DPDP data erasure). Handles both customers and vendors. Must run inside the
// caller's transaction so a failure rolls back atomically.
//
// Order matters: relations without an explicit onDelete default to Prisma's
// Restrict on their required FK, so children must be removed before parents.
// The cascade deletes (MessageRead/CartItem/OrderItem/UdharEntry/Payment) are
// already declared in the schema, so removing parents cleans those up too.
export async function deleteUserData(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  const user = await tx.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  // 1. Rows owned directly by the user.
  await tx.messageRead.deleteMany({ where: { userId } });
  await tx.notification.deleteMany({ where: { userId } });

  // 2. Shops owned by this user (vendor case).
  const shopIds = (
    await tx.shop.findMany({ where: { ownerId: userId }, select: { id: true } })
  ).map((s) => s.id);
  const anyShop = shopIds.length > 0;

  // 3. Favourites: shops the user favourited, plus favourites of owned shops.
  await tx.favoriteShop.deleteMany({
    where: anyShop ? { OR: [{ userId }, { shopId: { in: shopIds } }] } : { userId },
  });

  // 4. Chats (as customer, or against owned shops): messages first (Restrict),
  //    then the chats themselves.
  const chatIds = (
    await tx.chat.findMany({
      where: anyShop ? { OR: [{ customerId: userId }, { shopId: { in: shopIds } }] } : { customerId: userId },
      select: { id: true },
    })
  ).map((c) => c.id);
  if (chatIds.length > 0) {
    await tx.message.deleteMany({ where: { chatId: { in: chatIds } } });
    await tx.chat.deleteMany({ where: { id: { in: chatIds } } });
  }

  // 5. Carts (cascade CartItem), Orders (cascade OrderItem), UdharLedger
  //    (cascade UdharEntry + Payment) — as customer or against owned shops.
  const broadWhere = anyShop ? { OR: [{ customerId: userId }, { shopId: { in: shopIds } }] } : { customerId: userId };
  await tx.cart.deleteMany({ where: broadWhere });
  await tx.order.deleteMany({ where: broadWhere });
  await tx.udharLedger.deleteMany({ where: broadWhere });

  // 6. Referrals: rows where the user was the referrer, or attached to owned
  //    shops. Rows where someone else referred this user still hold their
  //    phone (PII), so anonymise those instead of deleting the referrer's data.
  await tx.referral.deleteMany({
    where: anyShop ? { OR: [{ referrerId: userId }, { shopId: { in: shopIds } }] } : { referrerId: userId },
  });
  const referredByOthers = await tx.referral.findMany({
    where: { referredPhone: user.phone },
    select: { id: true },
  });
  for (const row of referredByOthers) {
    // Random 10-digit number avoids the (referrerId, referredPhone) unique pair.
    const anonymised = `9${String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, '0')}`;
    await tx.referral.update({
      where: { id: row.id },
      data: { referredName: 'Deleted User', referredPhone: anonymised },
    });
  }

  // 7. Owned-shop data, then the shops themselves.
  if (anyShop) {
    await tx.product.deleteMany({ where: { shopId: { in: shopIds } } });
    await tx.payout.deleteMany({
      where: { OR: [{ vendorId: userId }, { shopId: { in: shopIds } }] },
    });
    await tx.bankAccount.deleteMany({ where: { vendorId: userId } });
    await tx.shop.deleteMany({ where: { ownerId: userId } });
  }

  // 8. The user row itself.
  await tx.user.delete({ where: { id: userId } });
}
