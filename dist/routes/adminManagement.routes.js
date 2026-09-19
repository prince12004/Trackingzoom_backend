"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const Admin_1 = require("../models/Admin");
const activityLog_service_1 = require("../services/activityLog.service");
const router = (0, express_1.Router)();
router.use(auth_1.requireAdminAuth, (0, auth_1.requirePermission)('roles.manage'));
router.get('/', (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const admins = await Admin_1.Admin.find().populate('role', 'name slug').sort({ createdAt: -1 });
    (0, ApiResponse_1.sendSuccess)(res, admins);
}));
router.post('/', [
    (0, express_validator_1.body)('name').trim().notEmpty(),
    (0, express_validator_1.body)('email').isEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 8 }),
    (0, express_validator_1.body)('role').isMongoId(),
], validate_1.validate, (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { name, email, password, role } = req.body;
    const existing = await Admin_1.Admin.findOne({ email: email.toLowerCase() });
    if (existing)
        throw ApiError_1.ApiError.conflict('An admin with this email already exists');
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    const admin = await Admin_1.Admin.create({ name, email: email.toLowerCase(), passwordHash, role });
    await (0, activityLog_service_1.logActivity)({
        adminId: req.adminId,
        action: 'admin.create',
        module: 'admin',
        recordId: admin.id,
        newValue: { name, email },
        ip: req.ip,
    });
    (0, ApiResponse_1.sendSuccess)(res, { id: admin.id, name: admin.name, email: admin.email }, 'Admin created', 201);
}));
router.patch('/:id', (0, catchAsync_1.catchAsync)(async (req, res) => {
    const admin = await Admin_1.Admin.findById(req.params.id);
    if (!admin)
        throw ApiError_1.ApiError.notFound('Admin not found');
    const oldValue = { name: admin.name, role: admin.role, status: admin.status };
    const { name, role, status } = req.body;
    if (name)
        admin.name = name;
    if (role)
        admin.role = role;
    if (status)
        admin.status = status;
    await admin.save();
    await (0, activityLog_service_1.logActivity)({
        adminId: req.adminId,
        action: 'admin.update',
        module: 'admin',
        recordId: admin.id,
        oldValue,
        newValue: { name: admin.name, role: admin.role, status: admin.status },
        ip: req.ip,
    });
    (0, ApiResponse_1.sendSuccess)(res, admin, 'Admin updated');
}));
router.post('/:id/reset-password', [(0, express_validator_1.body)('password').isLength({ min: 8 })], validate_1.validate, (0, catchAsync_1.catchAsync)(async (req, res) => {
    const admin = await Admin_1.Admin.findById(req.params.id);
    if (!admin)
        throw ApiError_1.ApiError.notFound('Admin not found');
    admin.passwordHash = await bcryptjs_1.default.hash(req.body.password, 12);
    admin.tokenVersion += 1;
    await admin.save();
    await (0, activityLog_service_1.logActivity)({ adminId: req.adminId, action: 'admin.reset_password', module: 'admin', recordId: admin.id, ip: req.ip });
    (0, ApiResponse_1.sendSuccess)(res, null, 'Password reset successfully');
}));
exports.default = router;
//# sourceMappingURL=adminManagement.routes.js.map