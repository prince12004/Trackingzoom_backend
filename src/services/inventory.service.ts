import mongoose, { ClientSession, Types } from 'mongoose';
import { Inventory } from '../models/Inventory';
import { StockMovement, StockMovementType } from '../models/StockMovement';
import { Product } from '../models/Product';
import { ProductVariant } from '../models/ProductVariant';
import { ApiError } from '../utils/ApiError';

async function getOrCreateInventory(
  productId: Types.ObjectId | string,
  variantId: Types.ObjectId | string | null,
  session?: ClientSession
) {
  let inv = await Inventory.findOne({ product: productId, variant: variantId || null }).session(
    session || null
  );
  if (!inv) {
    const [created] = await Inventory.create(
      [{ product: productId, variant: variantId || null, available: 0, reserved: 0, sold: 0, damaged: 0, returned: 0 }],
      { session }
    );
    inv = created;
  }
  return inv;
}

async function syncCachedStock(
  productId: Types.ObjectId | string,
  variantId: Types.ObjectId | string | null,
  available: number,
  session?: ClientSession
) {
  if (variantId) {
    await ProductVariant.findByIdAndUpdate(variantId, { stockQuantity: available }, { session });
  } else {
    await Product.findByIdAndUpdate(productId, { stockQuantity: available }, { session });
  }
}

interface MovementInput {
  productId: Types.ObjectId | string;
  variantId?: Types.ObjectId | string | null;
  quantity: number;
  movementType: StockMovementType;
  referenceId?: string;
  adminId?: Types.ObjectId | string;
  reason?: string;
}

export async function addStock(input: MovementInput, session?: ClientSession) {
  const inv = await getOrCreateInventory(input.productId, input.variantId || null, session);
  const previousStock = inv.available;
  inv.available += input.quantity;
  await inv.save({ session });
  await syncCachedStock(input.productId, input.variantId || null, inv.available, session);
  await StockMovement.create(
    [
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
    ],
    { session }
  );
  return inv;
}

export async function reserveStock(input: MovementInput, session: ClientSession) {
  const inv = await getOrCreateInventory(input.productId, input.variantId || null, session);
  if (inv.available < input.quantity) {
    throw ApiError.badRequest(`Insufficient stock. Only ${inv.available} left.`);
  }
  const previousStock = inv.available;
  inv.available -= input.quantity;
  inv.reserved += input.quantity;
  await inv.save({ session });
  await syncCachedStock(input.productId, input.variantId || null, inv.available, session);
  await StockMovement.create(
    [
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
    ],
    { session }
  );
  return inv;
}

export async function releaseReservedStock(input: MovementInput, session?: ClientSession) {
  const inv = await getOrCreateInventory(input.productId, input.variantId || null, session);
  const previousStock = inv.available;
  inv.reserved = Math.max(0, inv.reserved - input.quantity);
  inv.available += input.quantity;
  await inv.save({ session });
  await syncCachedStock(input.productId, input.variantId || null, inv.available, session);
  await StockMovement.create(
    [
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
    ],
    { session }
  );
  return inv;
}

export async function confirmSale(input: MovementInput, session?: ClientSession) {
  const inv = await getOrCreateInventory(input.productId, input.variantId || null, session);
  inv.reserved = Math.max(0, inv.reserved - input.quantity);
  inv.sold += input.quantity;
  await inv.save({ session });
  await Product.findByIdAndUpdate(
    input.productId,
    { $inc: { soldCount: input.quantity } },
    { session }
  );
}

export async function processReturn(input: MovementInput, session?: ClientSession) {
  const inv = await getOrCreateInventory(input.productId, input.variantId || null, session);
  const previousStock = inv.available;
  inv.sold = Math.max(0, inv.sold - input.quantity);
  inv.returned += input.quantity;
  inv.available += input.quantity;
  await inv.save({ session });
  await syncCachedStock(input.productId, input.variantId || null, inv.available, session);
  await StockMovement.create(
    [
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
    ],
    { session }
  );
}

export const withTransaction = async <T>(fn: (session: ClientSession) => Promise<T>): Promise<T> => {
  const session = await mongoose.startSession();
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result!;
  } finally {
    session.endSession();
  }
};
