"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, unique: true, index: true },
    email: { type: String, lowercase: true, trim: true, sparse: true, index: true },
    passwordHash: { type: String, select: false },
    mobileVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
    avatarUrl: String,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dob: Date,
    referralCode: { type: String, unique: true, index: true },
    referredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: Date,
    marketingOptIn: { type: Boolean, default: true },
}, { timestamps: true });
exports.User = (0, mongoose_1.model)('User', userSchema);
//# sourceMappingURL=User.js.map