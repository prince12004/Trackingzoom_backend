import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { Permission, PERMISSION_CATALOG } from '../models/Permission';
import { Role, SYSTEM_ROLES } from '../models/Role';
import { Admin } from '../models/Admin';
import { getSettings } from '../models/Setting';
import { HomepageSection, HomepageSectionKey } from '../models/HomepageSection';
import { Page } from '../models/Page';
import { LEGAL_PAGES } from './legalContent';

const ROLE_PERMISSIONS: Record<(typeof SYSTEM_ROLES)[number], string[]> = {
  super_admin: PERMISSION_CATALOG.map((p) => p.code),
  admin: PERMISSION_CATALOG.map((p) => p.code).filter((c) => c !== 'roles.manage'),
  inventory_manager: ['products.view', 'products.edit', 'inventory.view', 'inventory.adjust', 'suppliers.manage', 'reports.view'],
  order_manager: ['orders.view', 'orders.update', 'orders.cancel', 'orders.refund', 'customers.view', 'reports.view'],
  content_manager: ['blogs.create', 'blogs.edit', 'blogs.delete', 'content.manage', 'marketing.manage', 'products.view'],
  sales_manager: ['leads.view', 'leads.assign', 'customers.view', 'marketing.manage', 'reports.view'],
  support_executive: ['customers.view', 'orders.view', 'leads.view'],
  installation_coordinator: ['installations.view', 'installations.assign', 'customers.view'],
  dealer_manager: ['dealers.view', 'dealers.approve', 'reports.view'],
};

const HOMEPAGE_SECTIONS: { key: HomepageSectionKey; title: string; displayOrder: number; enabled?: boolean }[] = [
  { key: 'hero', title: 'Hero Banner', displayOrder: 1 },
  { key: 'services', title: 'Our Services', displayOrder: 2 },
  { key: 'product_showcase', title: 'All Products (Tabbed)', displayOrder: 3 },
  { key: 'categories', title: 'Shop by Category', displayOrder: 4 },
  // Superseded by product_showcase's tabs — kept available but off by default to avoid duplicate rails.
  { key: 'featured_products', title: 'Featured Products', displayOrder: 5, enabled: false },
  { key: 'gps_products', title: 'GPS Trackers', displayOrder: 6 },
  { key: 'accessories', title: 'Vehicle Accessories', displayOrder: 7 },
  { key: 'stats', title: 'Our Numbers', displayOrder: 8 },
  { key: 'best_sellers', title: 'Best Sellers', displayOrder: 9, enabled: false },
  { key: 'new_arrivals', title: 'New Arrivals', displayOrder: 10, enabled: false },
  { key: 'offers', title: 'Special Offers', displayOrder: 11 },
  { key: 'how_it_works', title: 'How It Works', displayOrder: 12 },
  { key: 'why_choose_us', title: 'Why Choose Us', displayOrder: 13 },
  { key: 'trust_badges', title: 'Trust Badges', displayOrder: 14 },
  { key: 'compatibility', title: 'Compatible with Everything', displayOrder: 15 },
  { key: 'app_promotion', title: 'Download Our App', displayOrder: 16 },
  { key: 'expert_reviews', title: 'Expert Reviews', displayOrder: 17 },
  { key: 'customer_reviews', title: 'Customer Reviews', displayOrder: 18 },
  { key: 'blogs', title: 'From Our Blog', displayOrder: 19 },
  { key: 'callback', title: 'Request a Callback', displayOrder: 20 },
];

async function seed() {
  await connectDB();
  console.log('[seed] Connected to database');

  // Remove the obsolete index from older Permission documents.
  try {
    await Permission.collection.dropIndex('key_1');
    console.log('[seed] Removed obsolete permissions.key index');
  } catch (error: any) {
    if (error?.codeName !== 'IndexNotFound') throw error;
  }

  // Permissions
  for (const perm of PERMISSION_CATALOG) {
    await Permission.findOneAndUpdate({ code: perm.code }, perm, { upsert: true });
  }
  console.log(`[seed] Synced ${PERMISSION_CATALOG.length} permissions`);

  // Roles
  const roleDocs: Record<string, string> = {};
  for (const slug of SYSTEM_ROLES) {
    const role = await Role.findOneAndUpdate(
      { slug },
      {
        name: slug
          .split('_')
          .map((w) => w[0].toUpperCase() + w.slice(1))
          .join(' '),
        slug,
        permissions: ROLE_PERMISSIONS[slug],
        isSystemRole: true,
      },
      { upsert: true, new: true }
    );
    roleDocs[slug] = role.id;
  }
  console.log(`[seed] Synced ${SYSTEM_ROLES.length} system roles`);

  // Super admin account
  const seedEmail = process.env.SEED_ADMIN_EMAIL || 'admin@trackingzoom.com';
  const existingSuperAdmin = await Admin.findOne({ email: seedEmail });
  if (!existingSuperAdmin) {
    const seedPassword = process.env.SEED_ADMIN_PASSWORD || `Tz${Math.random().toString(36).slice(2, 10)}!A9`;
    const passwordHash = await bcrypt.hash(seedPassword, 12);
    await Admin.create({
      name: 'Super Admin',
      email: seedEmail,
      passwordHash,
      role: roleDocs.super_admin,
      status: 'active',
    });
    console.log('\n[seed] ============================================');
    console.log('[seed] Super Admin account created:');
    console.log(`[seed]   Email:    ${seedEmail}`);
    console.log(`[seed]   Password: ${seedPassword}`);
    console.log('[seed]   Log in at /admin and enable 2FA immediately.');
    console.log('[seed] ============================================\n');
  } else {
    console.log('[seed] Super Admin already exists, skipping');
  }

  // Settings
  const settings = await getSettings();
  if (!settings.general.contactNumber && !settings.general.email && !settings.general.address) {
    settings.general.contactNumber = '+91 99901 60027';
    settings.general.email = 'Infotrackingzoom@gmail.com';
    settings.general.address = 'Office No. 10, Pahlwan Market, Opp. JM Aroma, Sector 75, Noida, Uttar Pradesh 201301';
    settings.general.businessHours = 'Mon - Sat: 9:00 AM - 7:00 PM';
    settings.social.whatsapp = 'https://wa.me/919990160027';
    await settings.save();
    console.log('[seed] Settings general/contact info populated');
  } else {
    console.log('[seed] Settings document ensured (contact info already set)');
  }

  // Homepage sections. `enabled` is only applied on first insert so re-running
  // seed never clobbers an admin's manual enable/disable toggle in the dashboard.
  for (const section of HOMEPAGE_SECTIONS) {
    await HomepageSection.findOneAndUpdate(
      { key: section.key },
      {
        $set: { key: section.key, title: section.title, displayOrder: section.displayOrder },
        $setOnInsert: { enabled: section.enabled !== false },
      },
      { upsert: true }
    );
  }
  // These rails are now superseded by the product_showcase tabs — default them off.
  await HomepageSection.updateMany({ key: { $in: ['featured_products', 'best_sellers', 'new_arrivals'] } }, { enabled: false });
  console.log(`[seed] Synced ${HOMEPAGE_SECTIONS.length} homepage sections`);

  // Legal / static pages
  for (const page of LEGAL_PAGES) {
    await Page.findOneAndUpdate({ slug: page.slug }, page, { upsert: true });
  }
  console.log(`[seed] Synced ${LEGAL_PAGES.length} legal/content pages`);

  console.log('[seed] Done.');
  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
