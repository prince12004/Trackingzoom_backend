"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
mongoose_1.default.set('strictQuery', true);
async function connectDB() {
    mongoose_1.default.connection.on('connected', () => {
        console.log(`[db] connected -> ${mongoose_1.default.connection.name}`);
    });
    mongoose_1.default.connection.on('error', (err) => {
        console.error('[db] connection error', err);
    });
    mongoose_1.default.connection.on('disconnected', () => {
        console.warn('[db] disconnected');
    });
    await mongoose_1.default.connect(env_1.env.mongoUri);
}
async function disconnectDB() {
    await mongoose_1.default.disconnect();
}
//# sourceMappingURL=db.js.map