"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const crudFactory_1 = require("../utils/crudFactory");
const ExpertReview_1 = require("../models/ExpertReview");
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const router = (0, express_1.Router)();
const crud = (0, crudFactory_1.createCrudController)(ExpertReview_1.ExpertReview, { entityName: 'Expert review', defaultSort: { displayOrder: 1 } });
router.get('/', (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const items = await ExpertReview_1.ExpertReview.find({ status: 'active' }).sort({ displayOrder: 1 });
    (0, ApiResponse_1.sendSuccess)(res, items);
}));
router.get('/admin/all', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('marketing.manage'), crud.list);
router.post('/admin', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('marketing.manage'), crud.create);
router.patch('/admin/:id', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('marketing.manage'), crud.update);
router.delete('/admin/:id', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('marketing.manage'), crud.remove);
exports.default = router;
//# sourceMappingURL=expertReview.routes.js.map