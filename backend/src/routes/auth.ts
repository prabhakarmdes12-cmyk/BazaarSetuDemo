import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, generateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendOtpSchema, verifyOtpSchema, registerSchema } from '../validators';
import { authLimiter } from '../middleware/rateLimit';
import { generateOtp, saveOtp, verifyOtp, canResend } from '../lib/otp';
import { deliverOtp } from '../lib/sms';
import { deleteUserData } from '../lib/deleteAccount';
import { prisma } from '../lib/prisma';

const router = Router();

// Short human-friendly referral code, e.g. RAM739QD. Collisions are retried.
function generateReferralCode(name: string, phone: string): string {
  const base = (name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3) || 'BS').toUpperCase();
  const phonePart = phone.slice(-3);
  const rand = Math.random().toString(36).slice(2, 4).toUpperCase();
  return `${base}${phonePart}${rand}`;
}

// Send OTP
router.post('/send-otp', authLimiter, validate(sendOtpSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { phone } = req.body as { phone: string };

    if (!canResend(phone)) {
      return res.status(429).json({ success: false, message: 'Kripya thodi der baad try karein.' });
    }

    const otp = generateOtp();
    saveOtp(phone, otp);
    const result = await deliverOtp(phone, otp);
    if (!result.sent) {
      return res.status(503).json({ success: false, message: 'OTP delivery unavailable. Please try again later.' });
    }

    res.json({ success: true, ...(result.otp ? { otp: result.otp } : {}), message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// Verify OTP and login
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { phone, otp } = req.body as { phone: string; otp: string };

    const result = verifyOtp(phone, otp);
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.reason || 'Invalid OTP' });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found. Please register.' });
    }

    const token = generateToken(user.id, user.role);
    res.json({
      success: true,
      data: {
        user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
        token,
      },
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// Register new user — role is whitelisted to customer/vendor only.
router.post('/register', authLimiter, validate(registerSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { phone, name, role, ref, shopName, pincode } = req.body as { phone: string; name: string; role?: string; ref?: string; shopName?: string; pincode?: string };

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const userRole = role === 'vendor' ? 'vendor' : 'customer';

    let referralCode: string | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidate = generateReferralCode(name, phone);
      const collision = await prisma.user.findUnique({ where: { referralCode: candidate } });
      if (!collision) {
        referralCode = candidate;
        break;
      }
    }

    const user = await prisma.user.create({
      data: { phone, name, role: userRole, referralCode, privacyAcceptedAt: new Date() },
    });

    // If vendor, create a shop with customized 60-second onboarding attributes
    if (userRole === 'vendor') {
      const finalShopName = shopName?.trim() || `${name} ki Dukaan`;
      const finalPin = pincode?.trim() || '826001';
      await prisma.shop.create({
        data: {
          ownerId: user.id,
          name: finalShopName,
          phone,
          address: `Bank More, Dhanbad - ${finalPin}`,
          serviceablePincodes: finalPin,
          deliveryRadiusKm: 3.5,
          isActive: true,
        },
      });
    }

    // Referral: if the customer registered with someone's code, record it.
    if (ref && userRole === 'customer') {
      const referrer = await prisma.user.findUnique({ where: { referralCode: ref } });
      if (referrer && referrer.id !== user.id) {
        await prisma.referral.upsert({
          where: { referrerId_referredPhone: { referrerId: referrer.id, referredPhone: phone } },
          create: {
            code: ref,
            referrerId: referrer.id,
            referredName: name,
            referredPhone: phone,
            status: 'joined',
          },
          update: { status: 'joined', referredName: name },
        });
      }
    }

    const token = generateToken(user.id, user.role);
    res.json({
      success: true,
      data: {
        user: { id: user.id, phone: user.phone, name: user.name, role: user.role, referralCode: user.referralCode },
        token,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, phone: true, name: true, role: true, createdAt: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
});

// DPDP: erase the authenticated user's account and all their personal data.
router.delete('/account', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.$transaction(async (tx: any) => {
      await deleteUserData(tx, req.userId as string);
    });
    res.json({
      success: true,
      message: 'Account deleted. Aapka saara data hamesha ke liye hata diya gaya hai.',
    });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ success: false, message: 'Account deletion failed' });
  }
});

export default router;
