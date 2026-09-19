"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const mongoose_1 = __importDefault(require("mongoose"));
const ApiError_1 = require("../utils/ApiError");
const env_1 = require("../config/env");
function notFoundHandler(req, _res, next) {
    next(ApiError_1.ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
function errorHandler(err, req, res, _next) {
    let statusCode = 500;
    let message = 'Internal server error';
    let errors;
    if (err instanceof ApiError_1.ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors;
    }
    else if (err instanceof mongoose_1.default.Error.ValidationError) {
        statusCode = 400;
        message = 'Validation failed';
        errors = Object.values(err.errors).map((e) => e.message);
    }
    else if (err instanceof mongoose_1.default.Error.CastError) {
        statusCode = 400;
        message = `Invalid value for ${err.path}`;
    }
    else if (err &&
        typeof err === 'object' &&
        'code' in err &&
        err.code === 11000) {
        statusCode = 409;
        const keyValue = err.keyValue;
        message = `Duplicate value for: ${keyValue ? Object.keys(keyValue).join(', ') : 'field'}`;
    }
    else if (err instanceof Error) {
        message = env_1.env.isProd ? message : err.message;
    }
    if (!env_1.env.isProd && statusCode === 500) {
        console.error(err);
    }
    res.status(statusCode).json({
        success: false,
        message,
        ...(errors ? { errors } : {}),
        ...(!env_1.env.isProd && err instanceof Error ? { stack: err.stack } : {}),
    });
}
//# sourceMappingURL=errorHandler.js.map