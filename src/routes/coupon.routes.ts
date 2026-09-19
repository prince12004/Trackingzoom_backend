import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import { createCrudController } from '../utils/crudFactory';
import { Coupon } from '../models/Coupon';

const router = Router();
const crud = createCrudController(Coupon, { entityName: 'Coupon', searchFields: ['code'] });

router.use(requireAdminAuth, requirePermission('marketing.manage'));

router.get('/', crud.list);
router.get('/:id', crud.getById);
router.post(
  '/',
  [
    body('code').trim().notEmpty(),
    body('discountType').isIn(['percentage', 'fixed']),
    body('discountValue').isFloat({ min: 0 }),
    body('startDate').isISO8601(),
    body('expiryDate').isISO8601(),
  ],
  validate,
  crud.create
);
router.patch('/:id', crud.update);
router.delete('/:id', crud.remove);

export default router;
