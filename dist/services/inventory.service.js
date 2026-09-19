"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTransaction = void 0;
exports.addStock = addStock;
exports.reserveStock = reserveStock;
exports.releaseReservedStock = releaseReservedStock;
exports.confirmSale = confirmSale;
exports.processReturn = processReturn;
const mongoose_1 = __importDefault(require("mongoose"));
const Inventory_1 = require("../models/Inventory");
const StockMovement_1 = require("../models/StockMovement");
const Product_1 = require("../models/Product");
const ProductVariant_1 = require("../models/ProductVariant");
const ApiError_1 = require("../utils/ApiError");
async function getOrCreateInventory(productId, variantId, session) {
    let inv = await Inventory_1.Inventory.findOne({ product: productId, variant: variantId || null }).session(session || null);
    if (!inv) {
        const [created] = await Inventory_1.Inventory.create([{ product: productId, variant: variantId || null, available: 0, reserved: 0, sold: 0, damaged: 0, returned: 0 }], { session });
        inv = created;
    }
    return inv;
}
async function syncCachedStock(productId, variantId, available, session) {
    if (variantId) {
        await ProductVariant_1.ProductVariant.findByIdAndUpdate(variantId, { stockQuantity: available }, { session });
    }
    else {
        await Product_1.Product.findByIdAndUpdate(productId, { stockQuantity: available }, { session });
    }
}
async function addStock(input, session) {
    const inv = await getOrCreateInventory(input.productId, input.variantId || null, session);
    const previousStock = inv.available;
    inv.available += input.quantity;
    await inv.save({ session });
    await syncCachedStock(input.productId, input.variantId || null, inv.available, session);
    await StockMovement_1.StockMovement.create([
        {
            product: input.productId,
            variant: input.variantId || null,
            previousStock,
            quantityChanged: input.quantity,
            newStock: inv.available,
            movementType: input.movementType,
            referenceId: input.referenceId,
            admin: input.adminId,
            reason: input.reason,
        },
    ], { session });
    return inv;
}
async function reserveStock(input, session) {
    const inv = await getOrCreateInventory(input.productId, input.variantId || null, session);
    if (inv.available < input.quantity) {
        throw ApiError_1.ApiError.badRequest(`Insufficient stock. Only ${inv.available} left.`);
    }
    const previousStock = inv.available;
    inv.available -= input.quantity;
    inv.reserved += input.quantity;
    await inv.save({ session });
    await syncCachedStock(input.productId, input.variantId || null, inv.available, session);
    await StockMovement_1.StockMovement.create([
        {
            product: input.productId,
            variant: input.variantId || null,
            previousStock,
            quantityChanged: -input.quantity,
            newStock: inv.available,
            movementType: 'order',
            referenceId: input.referenceId,
            reason: input.reason || 'Reserved on order placement',
        },
    ], { session });
    return inv;
}
async function releaseReservedStock(input, session) {
    const inv = await getOrCreateInventory(input.productId, input.variantId || null, session);
    const previousStock = inv.available;
    inv.reserved = Math.max(0, inv.reserved - input.quantity);
    inv.available += input.quantity;
    await inv.save({ session });
    await syncCachedStock(input.productId, input.variantId || null, inv.available, session);
    await StockMovement_1.StockMovement.create([
        {
            product: input.productId,
            variant: input.variantId || null,
            previousStock,
            quantityChanged: input.quantity,
            newStock: inv.available,
            movementType: 'cancellation',
            referenceId: input.referenceId,
            reason: input.reason || 'Reserved stock released',
        },
    ], { session });
    return inv;
}
async function confirmSale(input, session) {
    const inv = await getOrCreateInventory(input.productId, input.variantId || null, session);
    inv.reserved = Math.max(0, inv.reserved - input.quantity);
    inv.sold += input.quantity;
    await inv.save({ session });
    await Product_1.Product.findByIdAndUpdate(input.productId, { $inc: { soldCount: input.quantity } }, { session });
}
async function processReturn(input, session) {
    const inv = await getOrCreateInventory(input.productId, input.variantId || null, session);
    const previousStock = inv.available;
    inv.sold = Math.max(0, inv.sold - input.quantity);
    inv.returned += input.quantity;
    inv.available += input.quantity;
    await inv.save({ session });
    await syncCachedStock(input.productId, input.variantId || null, inv.available, session);
    await StockMovement_1.StockMovement.create([
        {
            product: input.productId,
            variant: input.variantId || null,
            previousStock,
            quantityChanged: input.quantity,
            newStock: inv.available,
            movementType: 'return',
            referenceId: input.referenceId,
            reason: input.reason || 'Return received',
        },
    ], { session });
}
const withTransaction = async (fn) => {
    const session = await mongoose_1.default.startSession();
    try {
        let result;
        await session.withTransaction(async () => {
            result = await fn(session);
        });
        return result;
    }
    finally {
        session.endSession();
    }
};
exports.withTransaction = withTransaction;
//# sourceMappingURL=inventory.service.js.map