"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSlug = toSlug;
exports.ensureUniqueSlug = ensureUniqueSlug;
const slugify_1 = __importDefault(require("slugify"));
function toSlug(value) {
    return (0, slugify_1.default)(value, { lower: true, strict: true, trim: true });
}
async function ensureUniqueSlug(baseSlug, exists) {
    let slug = baseSlug;
    let counter = 1;
    while (await exists(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter += 1;
    }
    return slug;
}
//# sourceMappingURL=slug.js.map