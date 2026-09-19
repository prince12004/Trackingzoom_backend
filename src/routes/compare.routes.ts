import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { optionalCustomerAuth } from '../middleware/auth';
import { ensureGuestId } from '../middleware/guestId';
import * as controller from '../controllers/compare.controller';

const router = Router();
router.use(ensureGuestId, optionalCustomerAuth);

router.get('/', controller.getCompareList);
router.post('/', [body('productId').isMongoId()], validate, controller.addToCompare);
router.delete('/:productId', controller.removeFromCompare);
router.delete('/', controller.clearCompare);

export default router;
