"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextSequence = nextSequence;
const mongoose_1 = require("mongoose");
const counterSchema = new mongoose_1.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
});
const Counter = (0, mongoose_1.model)('Counter', counterSchema);
async function nextSequence(key) {
    const counter = await Counter.findByIdAndUpdate(key, { $inc: { seq: 1 } }, { new: true, upsert: true });
    return counter.seq;
}
//# sourceMappingURL=sequence.js.map