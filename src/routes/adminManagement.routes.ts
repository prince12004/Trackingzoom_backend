import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Admin } from '../models/Admin';
import { Role } from '../models/Role';
import { logActivity } from '../services/activityLog.service';

const router = Router();
router.use(requireAdminAuth, requirePermission('roles.manage'));

router.get(
  '/',
  catchAsync(async (_req, res) => {
    const admins = await Admin.find().populate('role', 'name slug').sort({ createdAt: -1 });
    sendSuccess(res, admins);
  })
);

router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('role').isMongoId(),
  ],
  validate,
  catchAsync(async (req, res) => {
    const { name, email, password, role } = req.body;
    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) throw ApiError.conflict('An admin with this email already exists');

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await Admin.create({ name, email: email.toLowerCase(), passwordHash, role });

    await logActivity({
      adminId: req.adminId!,
      action: 'admin.create',
      module: 'admin',
      recordId: admin.id,
      newValue: { name, email },
      ip: req.ip,
    });

    sendSuccess(res, { id: admin.id, name: admin.name, email: admin.email }, 'Admin created', 201);
  })
);

router.patch(
  '/:id',
  catchAsync(async (req, res) => {
    const admin = await Admin.findById(req.params.id);
    if (!admin) throw ApiError.notFound('Admin not found');

    const oldValue = { name: admin.name, role: admin.role, status: admin.status };
    const { name, role, status } = req.body;
    if (name) admin.name = name;
    if (role) admin.role = role;
    if (status) admin.status = status;
    await admin.save();

    await logActivity({
      adminId: req.adminId!,
      action: 'admin.update',
      module: 'admin',
      recordId: admin.id,
      oldValue,
      newValue: { name: admin.name, role: admin.role, status: admin.status },
      ip: req.ip,
    });

    sendSuccess(res, admin, 'Admin updated');
  })
);

router.delete(
  '/:id',
  catchAsync(async (req, res) => {
    if (req.params.id === req.adminId) {
      throw ApiError.badRequest('You cannot delete your own admin account');
    }

    const admin = await Admin.findById(req.params.id).populate<{ role: { slug: string } }>('role', 'slug');
    if (!admin) throw ApiError.notFound('Admin not found');

    if (admin.role.slug === 'super_admin') {
      const superAdminRole = await Role.findOne({ slug: 'super_admin' });
      const remainingSuperAdmins = await Admin.countDocuments({ role: superAdminRole?._id, status: 'active' });
      if (remainingSuperAdmins <= 1) {
        throw ApiError.badRequest('Cannot delete the last Super Admin account');
      }
    }

    await admin.deleteOne();
    await logActivity({
      adminId: req.adminId!,
      action: 'admin.delete',
      module: 'admin',
      recordId: req.params.id,
      oldValue: { name: admin.name, email: admin.email },
      ip: req.ip,
    });
    sendSuccess(res, null, 'Admin deleted');
  })
);

router.post(
  '/:id/reset-password',
  [body('password').isLength({ min: 8 })],
  validate,
  catchAsync(async (req, res) => {
    const admin = await Admin.findById(req.params.id);
    if (!admin) throw ApiError.notFound('Admin not found');
    admin.passwordHash = await bcrypt.hash(req.body.password, 12);
    admin.tokenVersion += 1;
    await admin.save();
    await logActivity({ adminId: req.adminId!, action: 'admin.reset_password', module: 'admin', recordId: admin.id, ip: req.ip });
    sendSuccess(res, null, 'Password reset successfully');
  })
);

export default router;
