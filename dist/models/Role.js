"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_ROLES = exports.Role = void 0;
const mongoose_1 = require("mongoose");
const roleSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: String,
    permissions: [{ type: String }],
    isSystemRole: { type: Boolean, default: false },
}, { timestamps: true });
exports.Role = (0, mongoose_1.model)('Role', roleSchema);
exports.SYSTEM_ROLES = [
    'super_admin',
    'admin',
    'inventory_manager',
    'order_manager',
    'content_manager',
    'sales_manager',
    'support_executive',
    'installation_coordinator',
    'dealer_manager',
];
//# sourceMappingURL=Role.js.map