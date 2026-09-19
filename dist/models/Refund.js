"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Refund = void 0;
const mongoose_1 = require("mongoose");
const refundSchema = new mongoose_1.Schema({
    order: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    payment: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Payment', required: true },
    amount: { type: Number, required: true },
    reason: String,
    status: { type: String, enum: ['initiated', 'processing', 'completed', 'failed'], default: 'initiated' },
    providerRefundId: String,
    processedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });
exports.Refund = (0, mongoose_1.model)('Refund', refundSchema);
//# sourceMappingURL=Refund.js.map