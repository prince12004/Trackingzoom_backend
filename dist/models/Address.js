"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Address = void 0;
const mongoose_1 = require("mongoose");
const addressSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: String,
    addressLine1: { type: String, required: true },
    addressLine2: String,
    landmark: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true, match: /^[1-9][0-9]{5}$/ },
    country: { type: String, default: 'India' },
    isDefault: { type: Boolean, default: false },
}, { timestamps: true });
exports.Address = (0, mongoose_1.model)('Address', addressSchema);
//# sourceMappingURL=Address.js.map