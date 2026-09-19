"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
const Notification_1 = require("../models/Notification");
async function createNotification(input) {
    return Notification_1.Notification.create(input);
}
//# sourceMappingURL=notification.service.js.map