// ═══════════════════════════════════════════
// DineSmart OS — Auth Routes
// ═══════════════════════════════════════════

import { Router } from 'express';
import type { Request, Response } from 'express';
import * as authController from './auth.controller.js';
import { asyncHandler, authenticate, authenticateSuperAdmin, authRateLimiter } from '../../middleware/index.js';
import multer from 'multer';
import { cloudinary } from '../../config/cloudinary.js';
import { AppError } from '../../middleware/errorHandler.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/register', authRateLimiter, asyncHandler(authController.register));
router.post('/login', authRateLimiter, asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/logout', authenticate, asyncHandler(authController.logout));
router.post('/forgot-password', authRateLimiter, asyncHandler(authController.forgotPassword));
router.post('/reset-password/:token', authRateLimiter, asyncHandler(authController.resetPassword));
router.get('/me', authenticate, asyncHandler(authController.getMe));
router.get('/superadmin/me', authenticateSuperAdmin, asyncHandler(authController.getSuperAdminMe));
router.post('/superadmin/login', authRateLimiter, asyncHandler(authController.superAdminLogin));
router.post('/superadmin/google', authRateLimiter, asyncHandler(authController.superAdminGoogleLogin));
router.post('/superadmin/2fa/setup', authRateLimiter, asyncHandler(authController.setupSuperAdmin2FA));
router.post('/superadmin/2fa/verify', authRateLimiter, asyncHandler(authController.verifySuperAdmin2FA));

// Public document upload for registration (no auth required)
router.post('/upload-document', authRateLimiter, upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(400, 'No file uploaded');
  }
  try {
    const result: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'dinesmart/registration-docs',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file!.buffer);
    });
    res.json({ success: true, data: { url: result.secure_url || result.url } });
  } catch (error: any) {
    throw new AppError(500, `Cloudinary Upload Error: ${error.message || 'Unknown error'}`);
  }
}));

export default router;
