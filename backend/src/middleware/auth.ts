import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../lib/config';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string; role: string };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
}

// Like authenticateToken, but for public endpoints: attaches the user when a
// valid token is present and continues without one (no 401). Used for guest
// browsing so the login wall does not block discovery.
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string; role: string };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
  } catch {
    // Invalid token on a public route — treat as anonymous.
  }
  next();
}

export function generateToken(userId: string, role: string): string {
  // 7-day expiry — short enough to be safe, long enough for a marketplace session.
  return jwt.sign({ userId, role }, getJwtSecret(), { expiresIn: '7d' });
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  };
}
