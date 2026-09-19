"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockMovement = void 0;
const mongoose_1 = require("mongoose");
const stockMovementSchema = new mongoose_1.Schema({
    product: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ProductVariant', default: null },
    previousStock: { type: Number, required: true },
    quantityChanged: { type: Number, required: true },
    newStock: { type: Number, required: true },
    movementType: {
        type: String,
        enum: [
            'purchase',
            'manual_addition',
            'order',
            'cancellation',
            'return',
            'damage',
            'adjustment',
            'replacement',
        ],
        required: true,
    },
    referenceId: String,
    admin: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Admin' },
    reason: String,
}, { timestamps: { createdAt: true, updatedAt: false } });
stockMovementSchema.index({ createdAt: -1 });
exports.StockMovement = (0, mongoose_1.model)('StockMovement', stockMovementSchema);
//# sourceMappingURL=StockMovement.js.map