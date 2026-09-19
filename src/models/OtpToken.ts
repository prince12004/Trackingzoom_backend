import { Schema, model, Document } from 'mongoose';

export type OtpPurpose = 'register' | 'login' | 'cod_verification' | 'password_reset';

export interface IOtpToken extends Document {
  mobile: string;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumed: boolean;
  lastSentAt: Date;
  createdAt: Date;
}

const otpTokenSchema = new Schema<IOtpToken>(
  {
    mobile: { type: String, required: true, index: true },
    purpose: {
      type: String,
      enum: ['register', 'login', 'cod_verification', 'password_reset'],
      required: true,
    },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    consumed: { type: Boolean, default: false },
    lastSentAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

otpTokenSchema.index({ mobile: 1, purpose: 1, createdAt: -1 });
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpToken = model<IOtpToken>('OtpToken', otpTokenSchema);
