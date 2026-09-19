"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const env_1 = require("./config/env");
const rateLimiter_1 = require("./middleware/rateLimiter");
const errorHandler_1 = require("./middleware/errorHandler");
const routes_1 = __importDefault(require("./routes"));
function createApp() {
    const app = (0, express_1.default)();
    app.set('trust proxy', 1);
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    app.use((0, cors_1.default)({
        origin: env_1.env.clientUrl,
        credentials: true,
    }));
    app.use((0, compression_1.default)());
    app.use((0, morgan_1.default)(env_1.env.isProd ? 'combined' : 'dev'));
    app.use(express_1.default.json({
        limit: '2mb',
        verify: (req, _res, buf) => {
            req.rawBody = buf.toString();
        },
    }));
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, cookie_parser_1.default)());
    app.use((0, express_mongo_sanitize_1.default)());
    app.use(rateLimiter_1.globalLimiter);
    app.get('/health', (_req, res) => {
        res.json({ success: true, message: 'TrackingZoom GPS API is running', timestamp: new Date().toISOString() });
    });
    app.use('/api/v1', routes_1.default);
    app.use(errorHandler_1.notFoundHandler);
    app.use(errorHandler_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map