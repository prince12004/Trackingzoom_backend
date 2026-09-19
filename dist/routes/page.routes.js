"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const Page_1 = require("../models/Page");
const router = (0, express_1.Router)();
router.get('/:slug', (0, catchAsync_1.catchAsync)(async (req, res) => {
    const page = await Page_1.Page.findOne({ slug: req.params.slug });
    if (!page)
        throw ApiError_1.ApiError.notFound('Page not found');
    (0, ApiResponse_1.sendSuccess)(res, page);
}));
router.get('/', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('content.manage'), (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const pages = await Page_1.Page.find().sort({ slug: 1 });
    (0, ApiResponse_1.sendSuccess)(res, pages);
}));
router.put('/:slug', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('content.manage'), [(0, express_validator_1.body)('title').trim().notEmpty(), (0, express_validator_1.body)('content').trim().notEmpty()], validate_1.validate, (0, catchAsync_1.catchAsync)(async (req, res) => {
    const page = await Page_1.Page.findOneAndUpdate({ slug: req.params.slug }, { ...req.body, slug: req.params.slug }, { new: true, upsert: true });
    (0, ApiResponse_1.sendSuccess)(res, page, 'Page saved');
}));
exports.default = router;
//# sourceMappingURL=page.routes.js.map