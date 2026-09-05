import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadSchema } from '../validators';
import { uploadLimiter } from '../middleware/rateLimit';
import path from 'path';
import fs from 'fs';

const router = Router();

const MAX_BYTES = 2 * 1024 * 1024; // 2MB

// Magic-byte sniffing — never trust the client-supplied extension or MIME string.
const MAGIC_BYTES: Record<string, { ext: string; mime: string; check: (b: Buffer) => boolean }> = {
  jpeg: {
    ext: '.jpg',
    mime: 'image/jpeg',
    check: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  png: {
    ext: '.png',
    mime: 'image/png',
    check: (b) =>
      b.length > 8 &&
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  webp: {
    ext: '.webp',
    mime: 'image/webp',
    check: (b) => b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  },
  gif: {
    ext: '.gif',
    mime: 'image/gif',
    check: (b) => b.length > 3 && b.toString('ascii', 0, 3) === 'GIF',
  },
};

function detectImageType(buffer: Buffer): { ext: string; mime: string } | null {
  for (const type of Object.values(MAGIC_BYTES)) {
    try {
      if (type.check(buffer)) return { ext: type.ext, mime: type.mime };
    } catch {
      // fall through
    }
  }
  return null;
}

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Secure base64 image upload
router.post('/', authenticateToken, uploadLimiter, validate(uploadSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { image } = req.body;

    // Strip data URL prefix if present
    const base64Data = image.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length === 0) {
      return res.status(400).json({ success: false, message: 'Empty image data' });
    }
    if (buffer.length > MAX_BYTES) {
      return res.status(400).json({ success: false, message: 'Image too large (max 2MB)' });
    }

    // Validate actual image type by magic bytes
    const detected = detectImageType(buffer);
    if (!detected) {
      return res.status(400).json({ success: false, message: 'Invalid image type. Only JPG, PNG, WEBP, GIF allowed.' });
    }

    const safeFilename = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${detected.ext}`;
    const filepath = path.join(uploadsDir, safeFilename);

    fs.writeFileSync(filepath, buffer);

    const url = `/uploads/${safeFilename}`;
    res.json({ success: true, data: { url } });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

export default router;
