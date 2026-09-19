import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';
import { initiateCheckout } from '../services/order.service';
import { env } from '../config/env';

export const initiate = catchAsync(async (req: Request, res: Response) => {
  const { addressId, paymentMethod, screenshotUrl } = req.body as {
    addressId: string;
    paymentMethod: 'online' | 'cod' | 'qr_manual';
    screenshotUrl?: string;
  };

  const result = await initiateCheckout({ userId: req.userId!, addressId, paymentMethod, screenshotUrl });

  if (result.paymentMethod === 'cod' || result.paymentMethod === 'qr_manual') {
    return sendSuccess(res, { order: result.order, paymentMethod: result.paymentMethod }, 'Order placed successfully', 201);
  }

  sendSuccess(
    res,
    {
      order: result.order,
      paymentMethod: 'online',
      razorpayKeyId: env.razorpay.keyId,
      razorpayOrder: result.razorpay,
    },
    'Payment initiated',
    201
  );
});
