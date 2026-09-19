import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireCustomerAuth } from '../middleware/auth';
import * as controller from '../controllers/wishlist.controller';

const router = Router();
router.use(requireCustomerAuth);

router.get('/', controller.getWishlist);
router.post('/', [body('productId').isMongoId()], validate, controller.addToWishlist);
router.delete('/:productId', controller.removeFromWishlist);

export default router;
