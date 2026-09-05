import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { claimReferralSchema } from '../validators';
import { prisma } from '../lib/prisma';

const router = Router();

// Get my referral code + invite stats
router.get('/mine', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { referralsReferrer: true },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const referrals = user.referralsReferrer;
    const joinedCount = referrals.filter((r: any) => r.status === 'joined').length;
    const rewardedCount = referrals.filter((r: any) => r.status === 'rewarded').length;
    const pendingCount = referrals.filter((r: any) => r.status === 'pending').length;
    const rewardAmount = referrals
      .filter((r: any) => r.status === 'rewarded')
      .reduce((s: any, r: any) => s + r.rewardAmount, 0);

    res.json({
      success: true,
      data: {
        code: user.referralCode,
        totalCount: referrals.length,
        joinedCount,
        pendingCount,
        rewardedCount,
        rewardAmount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get referrals' });
  }
});

// Claim a referral code (mark this phone as referred by `code`)
router.post('/claim', authenticateToken, validate(claimReferralSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { code, phone, name } = req.body;

    const referrer = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!referrer) {
      return res.status(404).json({ success: false, message: 'Invalid referral code' });
    }
    if (referrer.id === req.userId) {
      return res.status(400).json({ success: false, message: 'Cannot refer yourself' });
    }

    const existing = await prisma.referral.findUnique({
      where: { referrerId_referredPhone: { referrerId: referrer.id, referredPhone: phone } },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This phone is already referred' });
    }

    const referral = await prisma.referral.create({
      data: {
        code,
        referrerId: referrer.id,
        referredName: name || '',
        referredPhone: phone,
      },
    });

    res.json({ success: true, data: { referralId: referral.id, status: referral.status } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to claim referral' });
  }
});

export default router;
