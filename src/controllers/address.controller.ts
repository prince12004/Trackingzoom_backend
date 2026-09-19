import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Address } from '../models/Address';

export const listAddresses = catchAsync(async (req: Request, res: Response) => {
  const addresses = await Address.find({ user: req.userId }).sort({ isDefault: -1, createdAt: -1 });
  sendSuccess(res, addresses);
});

export const createAddress = catchAsync(async (req: Request, res: Response) => {
  const body = req.body;
  if (body.isDefault) {
    await Address.updateMany({ user: req.userId }, { isDefault: false });
  }
  const count = await Address.countDocuments({ user: req.userId });
  const address = await Address.create({ ...body, user: req.userId, isDefault: body.isDefault || count === 0 });
  sendSuccess(res, address, 'Address added', 201);
});

export const updateAddress = catchAsync(async (req: Request, res: Response) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.userId });
  if (!address) throw ApiError.notFound('Address not found');

  if (req.body.isDefault) {
    await Address.updateMany({ user: req.userId }, { isDefault: false });
  }

  Object.assign(address, req.body);
  await address.save();
  sendSuccess(res, address, 'Address updated');
});

export const deleteAddress = catchAsync(async (req: Request, res: Response) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!address) throw ApiError.notFound('Address not found');
  sendSuccess(res, null, 'Address deleted');
});
