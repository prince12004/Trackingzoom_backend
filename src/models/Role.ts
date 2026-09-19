import { Schema, model, Document } from 'mongoose';

export interface IRole extends Document {
  name: string;
  slug: string;
  description?: string;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: String,
    permissions: [{ type: String }],
    isSystemRole: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Role = model<IRole>('Role', roleSchema);

export const SYSTEM_ROLES = [
  'super_admin',
  'admin',
  'inventory_manager',
  'order_manager',
  'content_manager',
  'sales_manager',
  'support_executive',
  'installation_coordinator',
  'dealer_manager',
] as const;
