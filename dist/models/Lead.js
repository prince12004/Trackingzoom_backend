"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lead = void 0;
const mongoose_1 = require("mongoose");
const leadSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    mobile: { type: String, required: true, index: true },
    email: String,
    interestedProduct: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' },
    category: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category' },
    sourcePage: String,
    leadType: { type: String, enum: ['callback', 'expert'], default: 'callback' },
    message: String,
    assignedTo: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Admin' },
    status: {
        type: String,
        enum: ['new', 'contacted', 'follow_up', 'converted', 'not_interested', 'closed'],
        default: 'new',
        index: true,
    },
    notes: String,
}, { timestamps: true });
exports.Lead = (0, mongoose_1.model)('Lead', leadSchema);
//# sourceMappingURL=Lead.js.map