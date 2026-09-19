import { Router } from 'express';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import { createCrudController } from '../utils/crudFactory';
import { ExpertReview } from '../models/ExpertReview';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';

const router = Router();
const crud = createCrudController(ExpertReview, { entityName: 'Expert review', defaultSort: { displayOrder: 1 } });

router.get(
  '/',
  catchAsync(async (_req, res) => {
    const items = await ExpertReview.find({ status: 'active' }).sort({ displayOrder: 1 });
    sendSuccess(res, items);
  })
);

router.get('/admin/all', requireAdminAuth, requirePermission('marketing.manage'), crud.list);
router.post('/admin', requireAdminAuth, requirePermission('marketing.manage'), crud.create);
router.patch('/admin/:id', requireAdminAuth, requirePermission('marketing.manage'), crud.update);
router.delete('/admin/:id', requireAdminAuth, requirePermission('marketing.manage'), crud.remove);

export default router;
