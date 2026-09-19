"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const crudFactory_1 = require("../utils/crudFactory");
const FAQ_1 = require("../models/FAQ");
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const router = (0, express_1.Router)();
const crud = (0, crudFactory_1.createCrudController)(FAQ_1.FAQ, { entityName: 'FAQ', defaultSort: { displayOrder: 1 } });
router.get('/', (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const items = await FAQ_1.FAQ.find({ status: 'active' }).sort({ displayOrder: 1 });
    (0, ApiResponse_1.sendSuccess)(res, items);
}));
router.get('/admin/all', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('content.manage'), crud.list);
router.post('/admin', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('content.manage'), crud.create);
router.patch('/admin/:id', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('content.manage'), crud.update);
router.delete('/admin/:id', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('content.manage'), crud.remove);
exports.default = router;
//# sourceMappingURL=faq.routes.js.map