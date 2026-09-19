import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Role } from '../models/Role';
import { PERMISSION_CATALOG } from '../models/Permission';
import { logActivity } from '../services/activityLog.service';

const router = Router();
router.use(requireAdminAuth, requirePermission('roles.manage'));

router.get(
  '/permissions',
  catchAsync(async (_req, res) => {
    sendSuccess(res, PERMISSION_CATALOG);
  })
);

router.get(
  '/',
  catchAsync(async (_req, res) => {
    const roles = await Role.find().sort({ name: 1 });
    sendSuccess(res, roles);
  })
);

router.post(
  '/',
  [body('name').trim().notEmpty(), body('slug').trim().notEmpty(), body('permissions').isArray()],
  validate,
  catchAsync(async (req, res) => {
    const role = await Role.create(req.body);
    await logActivity({
      adminId: req.adminId!,
      action: 'role.create',
      module: 'admin',
      recordId: role.id,
      newValue: role.toObject(),
      ip: req.ip,
    });
    sendSuccess(res, role, 'Role created', 201);
  })
);

router.patch(
  '/:id',
  catchAsync(async (req, res) => {
    const role = await Role.findById(req.params.id);
    if (!role) throw ApiError.notFound('Role not found');
    if (role.isSystemRole && role.slug === 'super_admin') {
      throw ApiError.forbidden('The Super Admin role cannot be modified');
    }

    const oldValue = role.toObject();
    Object.assign(role, req.body);
    await role.save();

    await logActivity({
      adminId: req.adminId!,
      action: 'role.update',
      module: 'admin',
      recordId: role.id,
      oldValue,
      newValue: role.toObject(),
      ip: req.ip,
    });

    sendSuccess(res, role, 'Role updated');
  })
);

router.delete(
  '/:id',
  catchAsync(async (req, res) => {
    const role = await Role.findById(req.params.id);
    if (!role) throw ApiError.notFound('Role not found');
    if (role.isSystemRole) throw ApiError.forbidden('System roles cannot be deleted');

    await role.deleteOne();
    await logActivity({ adminId: req.adminId!, action: 'role.delete', module: 'admin', recordId: req.params.id, ip: req.ip });
    sendSuccess(res, null, 'Role deleted');
  })
);

export default router;
