// ═══════════════════════════════════════════
// DineSmart OS — Authentication Middleware
// ═══════════════════════════════════════════

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { JwtAccessPayload, JwtSuperAdminPayload } from '@dinesmart/shared';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtAccessPayload;
      superAdmin?: JwtSuperAdminPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.accessToken as string | undefined;

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function authenticateSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.superAdminToken || req.headers.authorization?.split(' ')[1] as string | undefined;

  if (!token) {
    res.status(401).json({ success: false, error: 'Super admin authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SUPERADMIN_SECRET) as JwtSuperAdminPayload;
    if (decoded.scope !== 'superadmin') {
      res.status(403).json({ success: false, error: 'Invalid scope' });
      return;
    }
    req.superAdmin = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired super admin token' });
  }
}
