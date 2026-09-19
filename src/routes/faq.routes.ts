import { Router } from 'express';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import { createCrudController } from '../utils/crudFactory';
import { FAQ } from '../models/FAQ';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';

const router = Router();
const crud = createCrudController(FAQ, { entityName: 'FAQ', defaultSort: { displayOrder: 1 } });

router.get(
  '/',
  catchAsync(async (_req, res) => {
    const items = await FAQ.find({ status: 'active' }).sort({ displayOrder: 1 });
    sendSuccess(res, items);
  })
);

router.get('/admin/all', requireAdminAuth, requirePermission('content.manage'), crud.list);
router.post('/admin', requireAdminAuth, requirePermission('content.manage'), crud.create);
router.patch('/admin/:id', requireAdminAuth, requirePermission('content.manage'), crud.update);
router.delete('/admin/:id', requireAdminAuth, requirePermission('content.manage'), crud.remove);

export default router;
