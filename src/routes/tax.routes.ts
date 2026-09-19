import { Router } from 'express';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import { createCrudController } from '../utils/crudFactory';
import { Tax } from '../models/Tax';

const router = Router();
const crud = createCrudController(Tax, { entityName: 'Tax' });

router.use(requireAdminAuth, requirePermission('settings.manage'));
router.get('/', crud.list);
router.post('/', crud.create);
router.patch('/:id', crud.update);
router.delete('/:id', crud.remove);

export default router;
