import { Router } from 'express';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import { createCrudController } from '../utils/crudFactory';
import { Banner } from '../models/Banner';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';

const router = Router();
const crud = createCrudController(Banner, { entityName: 'Banner', defaultSort: { displayOrder: 1 } });

router.get(
  '/',
  catchAsync(async (_req, res) => {
    const now = new Date();
    const items = await Banner.find({ status: 'active', startDate: { $lte: now }, endDate: { $gte: now } }).sort({
      displayOrder: 1,
    });
    sendSuccess(res, items);
  })
);

router.get('/admin/all', requireAdminAuth, requirePermission('marketing.manage'), crud.list);
router.post('/admin', requireAdminAuth, requirePermission('marketing.manage'), crud.create);
router.patch('/admin/:id', requireAdminAuth, requirePermission('marketing.manage'), crud.update);
router.delete('/admin/:id', requireAdminAuth, requirePermission('marketing.manage'), crud.remove);

export default router;
