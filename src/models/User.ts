import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  mobile: string;
  email?: string;
  passwordHash?: string;
  mobileVerified: boolean;
  emailVerified: boolean;
  status: 'active' | 'blocked';
  avatarUrl?: string;
  gender?: 'male' | 'female' | 'other';
  dob?: Date;
  referralCode: string;
  referredBy?: Types.ObjectId;
  tokenVersion: number;
  lastLoginAt?: Date;
  marketingOptIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, unique: true, index: true },
    email: { type: String, lowercase: true, trim: true, sparse: true, index: true },
    passwordHash: { type: String, select: false },
    mobileVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
    avatarUrl: String,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dob: Date,
    referralCode: { type: String, unique: true, index: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: Date,
    marketingOptIn: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', userSchema);
