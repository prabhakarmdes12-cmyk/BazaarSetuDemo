import { Server as SocketServer, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../lib/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

// Verify the requesting user is a participant of the chat (customer or shop owner).
async function isChatParticipant(prisma: PrismaClient, chatId: string, userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { shop: { select: { ownerId: true } } },
  });
  if (!chat) return false;
  return chat.customerId === userId || chat.shop.ownerId === userId;
}

export function setupSocketHandlers(io: SocketServer, prisma: PrismaClient) {
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, getJwtSecret()) as { userId: string; role: string };
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId} (${socket.userRole})`);

    // Join user's personal room for notifications
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    socket.on('join_chat', async ({ chatId }: { chatId: string }) => {
      // IDOR fix: only join rooms the user is actually part of.
      const allowed = await isChatParticipant(prisma, chatId, socket.userId);
      if (!allowed) return;
      socket.join(`chat:${chatId}`);
    });

    socket.on('leave_chat', ({ chatId }: { chatId: string }) => {
      socket.leave(`chat:${chatId}`);
    });

    // Typing indicator
    socket.on('typing', async ({ chatId }: { chatId: string }) => {
      const allowed = await isChatParticipant(prisma, chatId, socket.userId);
      if (!allowed) return;
      socket.to(`chat:${chatId}`).emit('user_typing', {
        userId: socket.userId,
        userRole: socket.userRole,
        chatId,
      });
    });

    socket.on('stop_typing', async ({ chatId }: { chatId: string }) => {
      const allowed = await isChatParticipant(prisma, chatId, socket.userId);
      if (!allowed) return;
      socket.to(`chat:${chatId}`).emit('user_stop_typing', {
        userId: socket.userId,
        chatId,
      });
    });

    // Mark messages as read
    socket.on('mark_read', async ({ chatId }: { chatId: string }) => {
      if (!socket.userId) return;
      try {
        const allowed = await isChatParticipant(prisma, chatId, socket.userId);
        if (!allowed) return;

        await prisma.message.updateMany({
          where: { chatId, senderId: { not: socket.userId }, isRead: false },
          data: { isRead: true },
        });
        socket.to(`chat:${chatId}`).emit('messages_read', {
          chatId,
          readBy: socket.userId,
        });
      } catch (err) {
        console.error('mark_read error:', err);
      }
    });

    // Send text message
    socket.on('send_message', async ({ chatId, content, type = 'TEXT' }: { chatId: string; content: string; type?: string }) => {
      if (!socket.userId) return;
      if (typeof content !== 'string' || content.trim().length === 0 || content.length > 5000) return;
      if (type !== 'TEXT' && type !== 'PRODUCT') return;

      try {
        const chat = await prisma.chat.findUnique({
          where: { id: chatId },
          include: { shop: true },
        });
        if (!chat) return;

        const isCustomer = chat.customerId === socket.userId;
        const isVendor = chat.shop.ownerId === socket.userId;
        if (!isCustomer && !isVendor) return;

        const message = await prisma.message.create({
          data: {
            chatId,
            senderId: socket.userId,
            senderRole: isCustomer ? 'customer' : 'vendor',
            type,
            content,
          },
        });

        await prisma.chat.update({
          where: { id: chatId },
          data: { updatedAt: new Date() },
        });

        const messageData = {
          id: message.id,
          chatId: message.chatId,
          senderId: message.senderId,
          senderRole: message.senderRole,
          type: message.type,
          content: message.content,
          isRead: false,
          createdAt: message.createdAt.toISOString(),
        };

        io.to(`chat:${chatId}`).emit('new_message', messageData);

        // Create notification for the other party
        const notifyUserId = isCustomer ? chat.shop.ownerId : chat.customerId;
        await prisma.notification.create({
          data: {
            userId: notifyUserId,
            type: 'NEW_MESSAGE',
            title: isCustomer ? 'Naya Message' : `${chat.shop.name} ne reply kiya`,
            body: content.substring(0, 100),
            data: JSON.stringify({ chatId }),
          },
        });
        io.to(`user:${notifyUserId}`).emit('notification', { type: 'NEW_MESSAGE', chatId });
      } catch (err) {
        console.error('send_message error:', err);
      }
    });

    // Send product message
    socket.on('send_product_message', async ({ chatId, product }: {
      chatId: string;
      product: { name: string; price: number; unit: string; image?: string };
    }) => {
      if (!socket.userId) return;

      // Validate product payload
      if (
        typeof product !== 'object' || product === null ||
        typeof product.name !== 'string' || product.name.trim().length === 0 || product.name.length > 200 ||
        typeof product.price !== 'number' || !Number.isFinite(product.price) || product.price <= 0 ||
        typeof product.unit !== 'string' || product.unit.length === 0 || product.unit.length > 20 ||
        (product.image !== undefined && (typeof product.image !== 'string' || product.image.length > 1000))
      ) {
        return;
      }

      try {
        const chat = await prisma.chat.findUnique({
          where: { id: chatId },
          include: { shop: true },
        });
        if (!chat || chat.shop.ownerId !== socket.userId) return;

        const newProduct = await prisma.product.create({
          data: {
            shopId: chat.shopId,
            name: product.name.trim(),
            price: product.price,
            unit: product.unit.trim(),
            image: product.image || '',
            category: 'General',
          },
        });

        const productData = JSON.stringify({
          id: newProduct.id,
          name: newProduct.name,
          price: newProduct.price,
          unit: newProduct.unit,
          image: newProduct.image,
          isAvailable: true,
        });

        const message = await prisma.message.create({
          data: {
            chatId,
            senderId: socket.userId,
            senderRole: 'vendor',
            type: 'PRODUCT',
            content: `Product: ${newProduct.name} - ₹${newProduct.price}/${newProduct.unit}`,
            productId: newProduct.id,
            productData,
          },
        });

        const messageData = {
          id: message.id,
          chatId: message.chatId,
          senderId: message.senderId,
          senderRole: message.senderRole,
          type: message.type,
          content: message.content,
          isRead: false,
          product: {
            id: newProduct.id,
            name: newProduct.name,
            price: newProduct.price,
            unit: newProduct.unit,
            image: newProduct.image,
            isAvailable: true,
            shopId: newProduct.shopId,
            description: '',
            category: 'General',
            createdAt: newProduct.createdAt.toISOString(),
          },
          createdAt: message.createdAt.toISOString(),
        };

        io.to(`chat:${chatId}`).emit('new_message', messageData);
        io.to(`chat:${chatId}`).emit('chat_updated', { chatId, newProduct });

        // Notify customer
        await prisma.notification.create({
          data: {
            userId: chat.customerId,
            type: 'NEW_MESSAGE',
            title: `${chat.shop.name} ne product share kiya`,
            body: `${newProduct.name} - ₹${newProduct.price}/${newProduct.unit}`,
            data: JSON.stringify({ chatId }),
          },
        });
        io.to(`user:${chat.customerId}`).emit('notification', { type: 'NEW_MESSAGE', chatId });
      } catch (err) {
        console.error('send_product_message error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
}
