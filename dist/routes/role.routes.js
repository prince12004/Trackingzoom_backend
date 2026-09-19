"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const Role_1 = require("../models/Role");
const Permission_1 = require("../models/Permission");
const activityLog_service_1 = require("../services/activityLog.service");
const router = (0, express_1.Router)();
router.use(auth_1.requireAdminAuth, (0, auth_1.requirePermission)('roles.manage'));
router.get('/permissions', (0, catchAsync_1.catchAsync)(async (_req, res) => {
    (0, ApiResponse_1.sendSuccess)(res, Permission_1.PERMISSION_CATALOG);
}));
router.get('/', (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const roles = await Role_1.Role.find().sort({ name: 1 });
    (0, ApiResponse_1.sendSuccess)(res, roles);
}));
router.post('/', [(0, express_validator_1.body)('name').trim().notEmpty(), (0, express_validator_1.body)('slug').trim().notEmpty(), (0, express_validator_1.body)('permissions').isArray()], validate_1.validate, (0, catchAsync_1.catchAsync)(async (req, res) => {
    const role = await Role_1.Role.create(req.body);
    await (0, activityLog_service_1.logActivity)({
        adminId: req.adminId,
        action: 'role.create',
        module: 'admin',
        recordId: role.id,
        newValue: role.toObject(),
        ip: req.ip,
    });
    (0, ApiResponse_1.sendSuccess)(res, role, 'Role created', 201);
}));
router.patch('/:id', (0, catchAsync_1.catchAsync)(async (req, res) => {
    const role = await Role_1.Role.findById(req.params.id);
    if (!role)
        throw ApiError_1.ApiError.notFound('Role not found');
    if (role.isSystemRole && role.slug === 'super_admin') {
        throw ApiError_1.ApiError.forbidden('The Super Admin role cannot be modified');
    }
    const oldValue = role.toObject();
    Object.assign(role, req.body);
    await role.save();
    await (0, activityLog_service_1.logActivity)({
        adminId: req.adminId,
        action: 'role.update',
        module: 'admin',
        recordId: role.id,
        oldValue,
        newValue: role.toObject(),
        ip: req.ip,
    });
    (0, ApiResponse_1.sendSuccess)(res, role, 'Role updated');
}));
router.delete('/:id', (0, catchAsync_1.catchAsync)(async (req, res) => {
    const role = await Role_1.Role.findById(req.params.id);
    if (!role)
        throw ApiError_1.ApiError.notFound('Role not found');
    if (role.isSystemRole)
        throw ApiError_1.ApiError.forbidden('System roles cannot be deleted');
    await role.deleteOne();
    await (0, activityLog_service_1.logActivity)({ adminId: req.adminId, action: 'role.delete', module: 'admin', recordId: req.params.id, ip: req.ip });
    (0, ApiResponse_1.sendSuccess)(res, null, 'Role deleted');
}));
exports.default = router;
//# sourceMappingURL=role.routes.js.map