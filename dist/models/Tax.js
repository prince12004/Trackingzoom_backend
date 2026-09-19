"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tax = void 0;
const mongoose_1 = require("mongoose");
const taxSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    isDefault: { type: Boolean, default: false },
}, { timestamps: true });
exports.Tax = (0, mongoose_1.model)('Tax', taxSchema);
//# sourceMappingURL=Tax.js.map