"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const express_validator_1 = require("express-validator");
const ApiError_1 = require("../utils/ApiError");
function validate(req, _res, next) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next(ApiError_1.ApiError.badRequest('Validation failed', errors.array()));
    }
    next();
}
//# sourceMappingURL=validate.js.map