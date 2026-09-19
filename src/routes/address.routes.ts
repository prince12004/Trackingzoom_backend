import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireCustomerAuth } from '../middleware/auth';
import * as controller from '../controllers/address.controller';

const router = Router();
router.use(requireCustomerAuth);

router.get('/', controller.listAddresses);
router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('mobile').matches(/^[6-9]\d{9}$/),
    body('addressLine1').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('state').trim().notEmpty(),
    body('pincode').matches(/^[1-9][0-9]{5}$/),
  ],
  validate,
  controller.createAddress
);
router.patch('/:id', controller.updateAddress);
router.delete('/:id', controller.deleteAddress);

export default router;
