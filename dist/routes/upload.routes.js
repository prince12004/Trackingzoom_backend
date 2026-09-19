"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const upload_service_1 = require("../services/upload.service");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error('Only JPEG, PNG, WEBP and GIF images are allowed'));
        }
        cb(null, true);
    },
});
router.post('/image', auth_1.requireAdminAuth, upload.single('image'), (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.file)
        throw ApiError_1.ApiError.badRequest('No image file provided');
    const folder = req.query.folder || 'misc';
    const result = await (0, upload_service_1.uploadBuffer)(req.file.buffer, folder);
    (0, ApiResponse_1.sendSuccess)(res, result, 'Image uploaded', 201);
}));
exports.default = router;
//# sourceMappingURL=upload.routes.js.map