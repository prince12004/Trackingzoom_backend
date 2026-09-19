"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const crudFactory_1 = require("../utils/crudFactory");
const Banner_1 = require("../models/Banner");
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const router = (0, express_1.Router)();
const crud = (0, crudFactory_1.createCrudController)(Banner_1.Banner, { entityName: 'Banner', defaultSort: { displayOrder: 1 } });
router.get('/', (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const now = new Date();
    const items = await Banner_1.Banner.find({ status: 'active', startDate: { $lte: now }, endDate: { $gte: now } }).sort({
        displayOrder: 1,
    });
    (0, ApiResponse_1.sendSuccess)(res, items);
}));
router.get('/admin/all', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('marketing.manage'), crud.list);
router.post('/admin', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('marketing.manage'), crud.create);
router.patch('/admin/:id', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('marketing.manage'), crud.update);
router.delete('/admin/:id', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('marketing.manage'), crud.remove);
exports.default = router;
//# sourceMappingURL=banner.routes.js.map