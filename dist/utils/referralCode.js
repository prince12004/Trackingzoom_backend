"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReferralCode = generateReferralCode;
const crypto_1 = __importDefault(require("crypto"));
function generateReferralCode(name) {
    const prefix = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'USER';
    const suffix = crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}${suffix}`;
}
//# sourceMappingURL=referralCode.js.map