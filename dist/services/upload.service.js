"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBuffer = uploadBuffer;
exports.deleteImage = deleteImage;
const cloudinary_1 = require("cloudinary");
const env_1 = require("../config/env");
const ApiError_1 = require("../utils/ApiError");
function isConfigured() {
    return !!(env_1.env.cloudinary.cloudName && env_1.env.cloudinary.apiKey && env_1.env.cloudinary.apiSecret);
}
if (isConfigured()) {
    cloudinary_1.v2.config({
        cloud_name: env_1.env.cloudinary.cloudName,
        api_key: env_1.env.cloudinary.apiKey,
        api_secret: env_1.env.cloudinary.apiSecret,
    });
}
async function uploadBuffer(buffer, folder) {
    if (!isConfigured()) {
        throw ApiError_1.ApiError.internal('Image storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.');
    }
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({ folder: `trackingzoom/${folder}`, resource_type: 'image' }, (error, result) => {
            if (error || !result)
                return reject(error);
            resolve({ url: result.secure_url, publicId: result.public_id });
        });
        stream.end(buffer);
    });
}
async function deleteImage(publicId) {
    if (!isConfigured())
        return;
    await cloudinary_1.v2.uploader.destroy(publicId);
}
//# sourceMappingURL=upload.service.js.map