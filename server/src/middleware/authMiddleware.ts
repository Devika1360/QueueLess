import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@queueless.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * Simple admin auth middleware.
 * Checks for a Base64-encoded email:password in the Authorization header.
 * In production, replace this with Firebase Admin SDK token verification.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.status(401).json({ error: 'Authorization required' });
    return;
  }

  try {
    const base64 = authHeader.slice(6); // Remove "Basic "
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    const [email, password] = decoded.split(':');

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      next();
      return;
    }

    res.status(403).json({ error: 'Admin access only' });
  } catch {
    res.status(401).json({ error: 'Invalid authorization' });
  }
}
