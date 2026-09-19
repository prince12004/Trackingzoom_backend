import { Schema, model, Document } from 'mongoose';

export interface IPermission extends Document {
  code: string;
  module: string;
  description: string;
}

const permissionSchema = new Schema<IPermission>({
  code: { type: String, required: true, unique: true },
  module: { type: String, required: true },
  description: { type: String, required: true },
});

export const Permission = model<IPermission>('Permission', permissionSchema);

export const PERMISSION_CATALOG: { code: string; module: string; description: string }[] = [
  ...['view', 'create', 'edit', 'delete'].map((a) => ({
    code: `products.${a}`,
    module: 'catalog',
    description: `${a} products`,
  })),
  ...['view', 'create', 'edit', 'delete'].map((a) => ({
    code: `categories.${a}`,
    module: 'catalog',
    description: `${a} categories`,
  })),
  { code: 'inventory.view', module: 'inventory', description: 'View inventory' },
  { code: 'inventory.adjust', module: 'inventory', description: 'Adjust stock' },
  { code: 'suppliers.manage', module: 'inventory', description: 'Manage suppliers & purchases' },
  { code: 'orders.view', module: 'orders', description: 'View orders' },
  { code: 'orders.update', module: 'orders', description: 'Update order status' },
  { code: 'orders.cancel', module: 'orders', description: 'Cancel orders' },
  { code: 'orders.refund', module: 'orders', description: 'Refund orders' },
  { code: 'customers.view', module: 'customers', description: 'View customers' },
  { code: 'customers.manage', module: 'customers', description: 'Manage customers' },
  ...['create', 'edit', 'delete'].map((a) => ({
    code: `blogs.${a}`,
    module: 'content',
    description: `${a} blogs`,
  })),
  { code: 'content.manage', module: 'content', description: 'Manage CMS content/pages/FAQs' },
  { code: 'leads.view', module: 'leads', description: 'View leads' },
  { code: 'leads.assign', module: 'leads', description: 'Assign leads' },
  { code: 'subscriptions.view', module: 'subscriptions', description: 'View subscriptions' },
  { code: 'subscriptions.manage', module: 'subscriptions', description: 'Manage subscriptions' },
  { code: 'installations.view', module: 'installations', description: 'View installation bookings' },
  { code: 'installations.assign', module: 'installations', description: 'Assign installer' },
  { code: 'dealers.view', module: 'dealers', description: 'View dealers' },
  { code: 'dealers.approve', module: 'dealers', description: 'Approve dealer applications' },
  { code: 'marketing.manage', module: 'marketing', description: 'Manage coupons/offers/banners/referrals' },
  { code: 'reports.view', module: 'reports', description: 'View reports & export data' },
  { code: 'tracking.view', module: 'tracking', description: 'View devices & tracking data' },
  { code: 'settings.manage', module: 'settings', description: 'Manage store settings' },
  { code: 'roles.manage', module: 'admin', description: 'Manage roles & permissions (Super Admin only)' },
  { code: 'activitylog.view', module: 'admin', description: 'View activity log' },
];
