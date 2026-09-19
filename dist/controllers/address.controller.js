"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAddress = exports.updateAddress = exports.createAddress = exports.listAddresses = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const Address_1 = require("../models/Address");
exports.listAddresses = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const addresses = await Address_1.Address.find({ user: req.userId }).sort({ isDefault: -1, createdAt: -1 });
    (0, ApiResponse_1.sendSuccess)(res, addresses);
});
exports.createAddress = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const body = req.body;
    if (body.isDefault) {
        await Address_1.Address.updateMany({ user: req.userId }, { isDefault: false });
    }
    const count = await Address_1.Address.countDocuments({ user: req.userId });
    const address = await Address_1.Address.create({ ...body, user: req.userId, isDefault: body.isDefault || count === 0 });
    (0, ApiResponse_1.sendSuccess)(res, address, 'Address added', 201);
});
exports.updateAddress = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const address = await Address_1.Address.findOne({ _id: req.params.id, user: req.userId });
    if (!address)
        throw ApiError_1.ApiError.notFound('Address not found');
    if (req.body.isDefault) {
        await Address_1.Address.updateMany({ user: req.userId }, { isDefault: false });
    }
    Object.assign(address, req.body);
    await address.save();
    (0, ApiResponse_1.sendSuccess)(res, address, 'Address updated');
});
exports.deleteAddress = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const address = await Address_1.Address.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!address)
        throw ApiError_1.ApiError.notFound('Address not found');
    (0, ApiResponse_1.sendSuccess)(res, null, 'Address deleted');
});
//# sourceMappingURL=address.controller.js.map