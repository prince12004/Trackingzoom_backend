import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

function isConfigured() {
  return !!(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);
}

if (isConfigured()) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

export async function uploadBuffer(buffer: Buffer, folder: string, mimeType = 'image/jpeg'): Promise<{ url: string; publicId: string }> {
  if (!isConfigured()) {
    // No Cloudinary configured — fall back to storing the image inline as a data URI so
    // upload-dependent features (product images, payment screenshots) still work out of
    // the box. Fine for occasional small images; switch to Cloudinary before scaling up.
    if (buffer.length > 2 * 1024 * 1024) {
      throw ApiError.badRequest('Image is too large to store without Cloudinary configured (max 2MB). Please use a smaller image.');
    }
    return { url: `data:${mimeType};base64,${buffer.toString('base64')}`, publicId: '' };
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `trackingzoom/${folder}`, resource_type: 'image' },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  if (!isConfigured()) return;
  await cloudinary.uploader.destroy(publicId);
}
