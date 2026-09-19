"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const crudFactory_1 = require("../utils/crudFactory");
const Tax_1 = require("../models/Tax");
const router = (0, express_1.Router)();
const crud = (0, crudFactory_1.createCrudController)(Tax_1.Tax, { entityName: 'Tax' });
router.use(auth_1.requireAdminAuth, (0, auth_1.requirePermission)('settings.manage'));
router.get('/', crud.list);
router.post('/', crud.create);
router.patch('/:id', crud.update);
router.delete('/:id', crud.remove);
exports.default = router;
//# sourceMappingURL=tax.routes.js.map