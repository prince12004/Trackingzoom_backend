"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.buildPagination = buildPagination;
function sendSuccess(res, data, message = 'Success', statusCode = 200, pagination) {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        ...(pagination ? { pagination } : {}),
    });
}
function buildPagination(page, limit, total) {
    return {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
    };
}
//# sourceMappingURL=ApiResponse.js.map