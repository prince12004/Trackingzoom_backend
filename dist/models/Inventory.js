"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Inventory = void 0;
const mongoose_1 = require("mongoose");
const inventorySchema = new mongoose_1.Schema({
    product: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ProductVariant', default: null },
    available: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
    damaged: { type: Number, default: 0, min: 0 },
    returned: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
inventorySchema.index({ product: 1, variant: 1 }, { unique: true });
exports.Inventory = (0, mongoose_1.model)('Inventory', inventorySchema);
//# sourceMappingURL=Inventory.js.map