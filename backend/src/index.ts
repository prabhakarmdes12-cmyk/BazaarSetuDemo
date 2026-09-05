import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { Server as SocketServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth';
import shopRoutes from './routes/shops';
import productRoutes from './routes/products';
import chatRoutes from './routes/chats';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import adminRoutes from './routes/admin';
import favoritesRoutes from './routes/favorites';
import notificationsRoutes from './routes/notifications';
import udhaarRoutes from './routes/udhaar';
import payoutsRoutes from './routes/payouts';
import uploadRoutes from './routes/upload';
import referralRoutes from './routes/referrals';
import shopBotRoutes from './routes/shopBot';
import basketRoutes from './routes/basket';
import chitigramRoutes from './routes/chitigram';
import ondcRoutes from './routes/ondc';
import razorpayWebhookRoutes from './routes/razorpayWebhook';
import { setupSocketHandlers } from './socket/handlers';
import { apiLimiter } from './middleware/rateLimit';
import { requestLog } from './middleware/requestLog';
import { errorHandler } from './middleware/errorHandler';
import { validateEnv, getCorsOrigins } from './lib/config';
import { prisma } from './lib/prisma';
import { startMerchantSlaService } from './services/slaService';

// Fail fast on missing production env vars (chiti-console pattern).
validateEnv();

const app = express();
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: getCorsOrigins(),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow product images from other origins
}));

app.use(cors({
  origin: getCorsOrigins(),
  credentials: true,
}));

// Razorpay webhooks need the raw body for signature verification, so mount
// BEFORE the JSON body parser below.
app.use('/api/webhooks', razorpayWebhookRoutes);

app.use(express.json({ limit: '5mb' }));

// Serve uploaded files with nosniff so a wrongly-served file can't be executed.
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));

// Make io available to routes (prisma is a shared singleton module now).
app.locals.io = io;

// Rate limiting + request logging (skip static /uploads)
app.use('/api', apiLimiter);
app.use('/api', requestLog);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/udhaar', udhaarRoutes);
app.use('/api/vendor/payouts', payoutsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/shop-bot', shopBotRoutes);
app.use('/api/basket', basketRoutes);
app.use('/api/chitigram', chitigramRoutes);

// ONDC contract stub — opt-in via env so prod builds stay lean by default.
if (process.env.ENABLE_ONDC === 'true') {
  app.use('/api/ondc', ondcRoutes);
  console.log('[ondc] ONDC contract stub enabled (ENABLE_ONDC=true)');
}

// Health check — verifies the database is actually reachable.
app.get('/api/health', async (_req, res) => {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: { status: 'connected', latencyMs: Date.now() - start },
    });
  } catch {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      db: { status: 'disconnected' },
    });
  }
});

// Error handler
app.use(errorHandler);

// Socket.io
setupSocketHandlers(io, prisma);

if (process.env.NODE_ENV !== 'test') {
  startMerchantSlaService(io);
}

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`BazaarSetu API running on port ${PORT}`);
  });
}

// Graceful shutdown — close HTTP server and disconnect Prisma cleanly.
async function shutdown(signal: string) {
  console.log(`${signal} received — shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Force exit after 10s if connections don't drain.
  setTimeout(() => process.exit(1), 10_000).unref();
}

if (process.env.NODE_ENV !== 'test') {
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export { app, server, io };
