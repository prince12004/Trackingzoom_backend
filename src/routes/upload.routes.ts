import { Router } from 'express';
import multer from 'multer';
import { requireAdminAuth, requireCustomerAuth } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { uploadBuffer } from '../services/upload.service';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, WEBP and GIF images are allowed'));
    }
    cb(null, true);
  },
});

router.post(
  '/image',
  requireAdminAuth,
  upload.single('image'),
  catchAsync(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('No image file provided');
    const folder = (req.query.folder as string) || 'misc';
    const result = await uploadBuffer(req.file.buffer, folder, req.file.mimetype);
    sendSuccess(res, result, 'Image uploaded', 201);
  })
);

// Customer-facing: payment screenshot upload for manual QR payment verification.
router.post(
  '/payment-screenshot',
  requireCustomerAuth,
  upload.single('image'),
  catchAsync(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('No image file provided');
    const result = await uploadBuffer(req.file.buffer, 'payment-screenshots', req.file.mimetype);
    sendSuccess(res, result, 'Screenshot uploaded', 201);
  })
);

export default router;
