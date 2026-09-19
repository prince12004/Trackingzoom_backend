"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCrudController = createCrudController;
const catchAsync_1 = require("./catchAsync");
const ApiResponse_1 = require("./ApiResponse");
const ApiError_1 = require("./ApiError");
function createCrudController(model, opts) {
    const list = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { page = '1', limit = '50', search, status } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (search && opts.searchFields?.length) {
            filter.$or = opts.searchFields.map((f) => ({ [f]: new RegExp(search, 'i') }));
        }
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
        const [items, total] = await Promise.all([
            model
                .find(filter)
                .sort(opts.defaultSort || { createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum),
            model.countDocuments(filter),
        ]);
        (0, ApiResponse_1.sendSuccess)(res, items, `${opts.entityName} list fetched`, 200, (0, ApiResponse_1.buildPagination)(pageNum, limitNum, total));
    });
    const getById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const doc = await model.findById(req.params.id);
        if (!doc)
            throw ApiError_1.ApiError.notFound(`${opts.entityName} not found`);
        (0, ApiResponse_1.sendSuccess)(res, doc);
    });
    const create = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const doc = await model.create(req.body);
        (0, ApiResponse_1.sendSuccess)(res, doc, `${opts.entityName} created`, 201);
    });
    const update = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const doc = await model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!doc)
            throw ApiError_1.ApiError.notFound(`${opts.entityName} not found`);
        (0, ApiResponse_1.sendSuccess)(res, doc, `${opts.entityName} updated`);
    });
    const remove = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const doc = await model.findByIdAndDelete(req.params.id);
        if (!doc)
            throw ApiError_1.ApiError.notFound(`${opts.entityName} not found`);
        (0, ApiResponse_1.sendSuccess)(res, null, `${opts.entityName} deleted`);
    });
    return { list, getById, create, update, remove };
}
//# sourceMappingURL=crudFactory.js.map