"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = logActivity;
const ActivityLog_1 = require("../models/ActivityLog");
async function logActivity(input) {
    return ActivityLog_1.ActivityLog.create({
        admin: input.adminId,
        action: input.action,
        module: input.module,
        recordId: input.recordId,
        oldValue: input.oldValue,
        newValue: input.newValue,
        ip: input.ip,
    });
}
//# sourceMappingURL=activityLog.service.js.map