"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const crudFactory_1 = require("../utils/crudFactory");
const Coupon_1 = require("../models/Coupon");
const router = (0, express_1.Router)();
const crud = (0, crudFactory_1.createCrudController)(Coupon_1.Coupon, { entityName: 'Coupon', searchFields: ['code'] });
router.use(auth_1.requireAdminAuth, (0, auth_1.requirePermission)('marketing.manage'));
router.get('/', crud.list);
router.get('/:id', crud.getById);
router.post('/', [
    (0, express_validator_1.body)('code').trim().notEmpty(),
    (0, express_validator_1.body)('discountType').isIn(['percentage', 'fixed']),
    (0, express_validator_1.body)('discountValue').isFloat({ min: 0 }),
    (0, express_validator_1.body)('startDate').isISO8601(),
    (0, express_validator_1.body)('expiryDate').isISO8601(),
], validate_1.validate, crud.create);
router.patch('/:id', crud.update);
router.delete('/:id', crud.remove);
exports.default = router;
//# sourceMappingURL=coupon.routes.js.map