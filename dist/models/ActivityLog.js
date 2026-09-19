"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLog = void 0;
const mongoose_1 = require("mongoose");
const activityLogSchema = new mongoose_1.Schema({
    admin: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    action: { type: String, required: true },
    module: { type: String, required: true, index: true },
    recordId: String,
    oldValue: mongoose_1.Schema.Types.Mixed,
    newValue: mongoose_1.Schema.Types.Mixed,
    ip: String,
}, { timestamps: { createdAt: true, updatedAt: false } });
activityLogSchema.index({ createdAt: -1 });
exports.ActivityLog = (0, mongoose_1.model)('ActivityLog', activityLogSchema);
//# sourceMappingURL=ActivityLog.js.map