"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    recipientType: { type: String, enum: ['admin', 'customer'], required: true, index: true },
    recipient: { type: mongoose_1.Schema.Types.ObjectId, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String,
    read: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false } });
notificationSchema.index({ recipientType: 1, recipient: 1, read: 1, createdAt: -1 });
exports.Notification = (0, mongoose_1.model)('Notification', notificationSchema);
//# sourceMappingURL=Notification.js.map