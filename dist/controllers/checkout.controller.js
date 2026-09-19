"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiate = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const order_service_1 = require("../services/order.service");
const env_1 = require("../config/env");
exports.initiate = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { addressId, paymentMethod } = req.body;
    const result = await (0, order_service_1.initiateCheckout)({ userId: req.userId, addressId, paymentMethod });
    if (result.paymentMethod === 'cod') {
        return (0, ApiResponse_1.sendSuccess)(res, { order: result.order, paymentMethod: 'cod' }, 'Order placed successfully', 201);
    }
    (0, ApiResponse_1.sendSuccess)(res, {
        order: result.order,
        paymentMethod: 'online',
        razorpayKeyId: env_1.env.razorpay.keyId,
        razorpayOrder: result.razorpay,
    }, 'Payment initiated', 201);
});
//# sourceMappingURL=checkout.controller.js.map