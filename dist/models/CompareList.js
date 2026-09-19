"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompareList = void 0;
const mongoose_1 = require("mongoose");
const compareListSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', index: true, sparse: true },
    guestId: { type: String, index: true, sparse: true },
    products: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });
exports.CompareList = (0, mongoose_1.model)('CompareList', compareListSchema);
//# sourceMappingURL=CompareList.js.map