"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Admin = void 0;
const mongoose_1 = require("mongoose");
const adminSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Role', required: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorTempSecret: { type: String, select: false },
    ipWhitelist: [{ type: String }],
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: Date,
    lastLoginIp: String,
}, { timestamps: true });
exports.Admin = (0, mongoose_1.model)('Admin', adminSchema);
//# sourceMappingURL=Admin.js.map