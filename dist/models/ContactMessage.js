"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactMessage = void 0;
const mongoose_1 = require("mongoose");
const contactMessageSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: String,
    subject: String,
    message: { type: String, required: true },
    status: { type: String, enum: ['new', 'in_progress', 'resolved', 'closed'], default: 'new', index: true },
}, { timestamps: true });
exports.ContactMessage = (0, mongoose_1.model)('ContactMessage', contactMessageSchema);
//# sourceMappingURL=ContactMessage.js.map