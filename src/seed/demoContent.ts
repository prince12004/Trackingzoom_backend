import { connectDB, disconnectDB } from '../config/db';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import { Product } from '../models/Product';
import { Banner } from '../models/Banner';
import { Offer } from '../models/Offer';
import { FAQ } from '../models/FAQ';
import { BlogCategory } from '../models/BlogCategory';
import { Blog } from '../models/Blog';
import { addStock } from '../services/inventory.service';
import { toSlug } from '../utils/slug';

async function upsertCategory(input: {
  name: string;
  description: string;
  image: string;
  parent?: string | null;
  displayOrder: number;
}) {
  const slug = toSlug(input.name);
  return Category.findOneAndUpdate(
    { slug },
    { ...input, slug, status: 'active' },
    { upsert: true, new: true }
  );
}

async function main() {
  await connectDB();
  console.log('[demo] Connected to database');

  // ---- Brand ----
  const brand = await Brand.findOneAndUpdate(
    { slug: 'trackingzoom' },
    {
      name: 'TrackingZoom',
      slug: 'trackingzoom',
      description: 'In-house GPS tracking & vehicle security devices.',
      status: 'active',
    },
    { upsert: true, new: true }
  );

  // ---- Categories (mirrors the 5 real TrackingZoom service lines) ----
  const carGps = await upsertCategory({
    name: 'Car GPS Tracking System',
    description: 'Real-time location, geofencing and trip history for your car.',
    image: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=400&q=80',
    displayOrder: 1,
  });
  const busGps = await upsertCategory({
    name: 'Bus GPS Tracking System',
    description: 'Fleet-wide visibility and route monitoring for transport operators.',
    image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400&q=80',
    displayOrder: 2,
  });
  const assetsTracking = await upsertCategory({
    name: 'Assets Tracking System',
    description: 'Track high-value equipment, containers and business assets.',
    image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400&q=80',
    displayOrder: 3,
  });
  const personalTracking = await upsertCategory({
    name: 'Personal Tracking System',
    description: 'Compact, discreet trackers for personal safety on bikes and beyond.',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80',
    displayOrder: 4,
  });
  const schoolTracking = await upsertCategory({
    name: 'School Tracking System',
    description: 'Live visibility into school transport for parents and administrators.',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80',
    displayOrder: 5,
  });
  const dashcams = await upsertCategory({
    name: 'Dashcams',
    description: 'HD dash cameras for continuous road recording.',
    image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=400&q=80',
    displayOrder: 6,
  });
  const accessories = await upsertCategory({
    name: 'Vehicle Accessories',
    description: 'Everyday accessories for car and bike owners.',
    image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400&q=80',
    displayOrder: 7,
  });

  console.log('[demo] Categories ready');

  // ---- Products ----
  interface DemoProduct {
    name: string;
    sku: string;
    category: string;
    shortDescription: string;
    description: string;
    regularPrice: number;
    salePrice: number;
    image: string;
    features: string[];
    specifications: { key: string; value: string }[];
    whatsInTheBox: string[];
    faqs: { question: string; answer: string }[];
    warranty: string;
    requiresInstallation: boolean;
    requiresSubscription: boolean;
    stock: number;
    featured?: boolean;
    bestSeller?: boolean;
    newArrival?: boolean;
  }

  const demoProducts: DemoProduct[] = [
    {
      name: 'TZ Wireless GPS Tracker Mini',
      sku: 'TZ-GPS-W100',
      category: String(carGps._id),
      shortDescription: 'Compact battery-powered GPS tracker with 45-day standby.',
      description:
        '<p>The TZ Wireless GPS Tracker Mini gives you real-time location tracking without any wiring. Magnetic mount, long battery life, and instant mobile alerts make it ideal for cars, trailers and rented vehicles.</p>',
      regularPrice: 3499,
      salePrice: 2799,
      image: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=800&q=80',
      features: ['Real-time GPS + LBS tracking', 'Magnetic waterproof casing', 'Geofence alerts', 'SOS button', 'Mobile app + web dashboard'],
      specifications: [
        { key: 'Battery Life', value: 'Up to 45 days standby' },
        { key: 'Network', value: '4G LTE' },
        { key: 'Water Resistance', value: 'IP65' },
        { key: 'Positioning Accuracy', value: '5-10 meters' },
      ],
      whatsInTheBox: ['1x GPS Tracker', 'USB-C Charging Cable', 'Magnetic Mount', 'Quick Start Guide'],
      faqs: [
        { question: 'Does this require professional installation?', answer: 'No, it is completely plug-and-play with a magnetic mount.' },
        { question: 'Is a SIM card included?', answer: 'An active subscription with data connectivity is required and can be managed from your account.' },
      ],
      warranty: '1 Year Manufacturer Warranty',
      requiresInstallation: false,
      requiresSubscription: true,
      stock: 40,
      featured: true,
      bestSeller: true,
    },
    {
      name: 'TZ Wired GPS Tracker Pro',
      sku: 'TZ-GPS-P200',
      category: String(carGps._id),
      shortDescription: 'Hardwired GPS tracker with engine immobilizer support.',
      description:
        '<p>Built for fleet owners and daily drivers who want permanent tracking. Hardwired to the vehicle battery for uninterrupted power, with optional remote engine immobilization.</p>',
      regularPrice: 4999,
      salePrice: 3999,
      image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
      features: ['Continuous power via vehicle battery', 'Remote engine immobilizer', 'Trip history & mileage reports', 'Harsh braking/acceleration alerts'],
      specifications: [
        { key: 'Power Input', value: '9-36V DC (vehicle battery)' },
        { key: 'Network', value: '4G LTE' },
        { key: 'Internal Backup Battery', value: '3 hours' },
      ],
      whatsInTheBox: ['1x GPS Tracker Unit', 'Wiring Harness', 'Installation Manual'],
      faqs: [{ question: 'Do I need installation?', answer: 'Yes, professional installation is required and can be booked from your account after purchase.' }],
      warranty: '1 Year Manufacturer Warranty',
      requiresInstallation: true,
      requiresSubscription: true,
      stock: 25,
      featured: true,
    },
    {
      name: 'TZ Bike GPS Tracker',
      sku: 'TZ-GPS-B150',
      category: String(personalTracking._id),
      shortDescription: 'Ultra-compact tracker built for bikes and scooters.',
      description: '<p>Small enough to hide under the seat, tough enough for daily rides. Get instant theft alerts and live location for your two-wheeler.</p>',
      regularPrice: 2499,
      salePrice: 1999,
      image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80',
      features: ['Vibration/theft alert', 'Compact hidden-mount design', 'Real-time location', 'Low battery alerts'],
      specifications: [
        { key: 'Dimensions', value: '48 x 32 x 12 mm' },
        { key: 'Battery Life', value: 'Up to 20 days standby' },
      ],
      whatsInTheBox: ['1x Bike GPS Tracker', 'Mounting Kit', 'Charging Cable'],
      faqs: [{ question: 'Will this drain my bike battery?', answer: 'No, it has its own internal battery and does not draw from the bike battery unless hardwired.' }],
      warranty: '1 Year Manufacturer Warranty',
      requiresInstallation: false,
      requiresSubscription: true,
      stock: 60,
      newArrival: true,
      bestSeller: true,
    },
    {
      name: 'TZ Fleet GPS Tracker for Buses',
      sku: 'TZ-GPS-F300',
      category: String(busGps._id),
      shortDescription: 'Fleet-grade tracker with route and stoppage monitoring.',
      description: '<p>Built for bus and transport operators who need fleet-wide visibility — live location, route deviation alerts and stoppage reports for every vehicle from one dashboard.</p>',
      regularPrice: 5499,
      salePrice: 4599,
      image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80',
      features: ['Multi-vehicle fleet dashboard', 'Route deviation alerts', 'Stoppage & idle time reports', 'Driver behavior monitoring'],
      specifications: [
        { key: 'Power Input', value: '9-36V DC (vehicle battery)' },
        { key: 'Network', value: '4G LTE' },
        { key: 'Fleet Dashboard', value: 'Included with subscription' },
      ],
      whatsInTheBox: ['1x Fleet GPS Tracker', 'Wiring Harness', 'Installation Manual'],
      faqs: [{ question: 'Can I monitor multiple buses together?', answer: 'Yes, all devices on your account appear on one fleet dashboard.' }],
      warranty: '1 Year Manufacturer Warranty',
      requiresInstallation: true,
      requiresSubscription: true,
      stock: 20,
      featured: true,
    },
    {
      name: 'TZ Asset GPS Tracker',
      sku: 'TZ-GPS-A250',
      category: String(assetsTracking._id),
      shortDescription: 'Rugged, long-life tracker for equipment and cargo.',
      description: '<p>A rugged, weatherproof tracker built for containers, trailers and high-value equipment that needs to be located anytime, anywhere.</p>',
      regularPrice: 3999,
      salePrice: 3299,
      image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&q=80',
      features: ['Rugged IP67 casing', 'Long-life battery (up to 90 days)', 'Motion-triggered alerts', 'Geofence on/off zones'],
      specifications: [
        { key: 'Battery Life', value: 'Up to 90 days standby' },
        { key: 'Water/Dust Resistance', value: 'IP67' },
      ],
      whatsInTheBox: ['1x Asset Tracker', 'Mounting Straps', 'Charging Cable'],
      faqs: [],
      warranty: '1 Year Manufacturer Warranty',
      requiresInstallation: false,
      requiresSubscription: true,
      stock: 30,
    },
    {
      name: 'TZ School Bus GPS Tracker',
      sku: 'TZ-GPS-S180',
      category: String(schoolTracking._id),
      shortDescription: 'Live school bus tracking for parents and administrators.',
      description: '<p>Give parents peace of mind with live school bus location, arrival alerts and route history — accessible from the school administration dashboard.</p>',
      regularPrice: 4599,
      salePrice: 3899,
      image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
      features: ['Live location for parents', 'Pickup/drop arrival alerts', 'Route history', 'School admin dashboard'],
      specifications: [
        { key: 'Power Input', value: '9-36V DC (vehicle battery)' },
        { key: 'Network', value: '4G LTE' },
      ],
      whatsInTheBox: ['1x GPS Tracker Unit', 'Wiring Harness', 'Installation Manual'],
      faqs: [{ question: 'Can parents get an app for this?', answer: 'Yes, parents can be given view-only access to their child\'s bus location via the mobile app.' }],
      warranty: '1 Year Manufacturer Warranty',
      requiresInstallation: true,
      requiresSubscription: true,
      stock: 15,
    },
    {
      name: 'TZ 4G Dash Cam',
      sku: 'TZ-DC-400',
      category: String(dashcams._id),
      shortDescription: '1080p dash camera with night vision and loop recording.',
      description: '<p>Capture every journey in crisp 1080p with automatic loop recording, collision-triggered emergency save, and night vision for low-light clarity.</p>',
      regularPrice: 5999,
      salePrice: 4499,
      image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80',
      features: ['1080p Full HD recording', 'Night vision', 'Loop recording', 'G-sensor collision detection', 'Wide 140° lens'],
      specifications: [
        { key: 'Resolution', value: '1920x1080 @30fps' },
        { key: 'Storage', value: 'MicroSD up to 128GB (not included)' },
        { key: 'Field of View', value: '140°' },
      ],
      whatsInTheBox: ['1x Dash Camera', 'Windshield Mount', 'Car Charger', 'USB Cable'],
      faqs: [{ question: 'Is a memory card included?', answer: 'No, you will need a MicroSD card of up to 128GB, sold separately.' }],
      warranty: '1 Year Manufacturer Warranty',
      requiresInstallation: false,
      requiresSubscription: false,
      stock: 35,
      newArrival: true,
    },
    {
      name: 'TZ Digital Tyre Inflator',
      sku: 'TZ-ACC-TI10',
      category: String(accessories._id),
      shortDescription: 'Portable digital tyre inflator with pressure auto-stop.',
      description: '<p>A must-have companion for every vehicle owner — inflate your tyres accurately with digital pressure readout and auto shut-off.</p>',
      regularPrice: 1999,
      salePrice: 1499,
      image: 'https://images.unsplash.com/photo-1600661653561-629509216228?w=800&q=80',
      features: ['Digital pressure gauge', 'Auto shut-off at target PSI', 'LED work light', 'Compact carry case'],
      specifications: [
        { key: 'Max Pressure', value: '150 PSI' },
        { key: 'Power', value: '12V car socket' },
      ],
      whatsInTheBox: ['1x Tyre Inflator', 'Carry Case', 'Adapter Nozzles'],
      faqs: [],
      warranty: '6 Months Warranty',
      requiresInstallation: false,
      requiresSubscription: false,
      stock: 80,
      bestSeller: true,
    },
    {
      name: 'TZ Portable Car Vacuum Cleaner',
      sku: 'TZ-ACC-VC20',
      category: String(accessories._id),
      shortDescription: 'High-suction handheld vacuum for car interiors.',
      description: '<p>Keep your car spotless with this compact, powerful vacuum cleaner designed specifically for car interiors and tight spaces.</p>',
      regularPrice: 1799,
      salePrice: 1299,
      image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&q=80',
      features: ['Strong suction power', 'HEPA filter', 'Washable dust container', '3m power cord'],
      specifications: [
        { key: 'Power', value: '12V, 100W' },
        { key: 'Cord Length', value: '3 meters' },
      ],
      whatsInTheBox: ['1x Vacuum Cleaner', 'Brush Attachment', 'Crevice Nozzle'],
      faqs: [],
      warranty: '6 Months Warranty',
      requiresInstallation: false,
      requiresSubscription: false,
      stock: 50,
    },
    {
      name: 'TZ Kids Safety GPS Tracker',
      sku: 'TZ-GPS-K120',
      category: String(personalTracking._id),
      shortDescription: 'Lightweight wearable tracker for kids with SOS button.',
      description: '<p>A lightweight, comfortable GPS tracker designed for children — with one-touch SOS calling and safe-zone alerts so you always know they\'re safe.</p>',
      regularPrice: 2999,
      salePrice: 2299,
      image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
      features: ['One-touch SOS button', 'Safe-zone (geofence) alerts', 'Lightweight wearable design', 'Two-way calling'],
      specifications: [
        { key: 'Battery Life', value: 'Up to 5 days' },
        { key: 'Weight', value: '38g' },
      ],
      whatsInTheBox: ['1x Kids GPS Tracker', 'Charging Dock', 'Wristband'],
      faqs: [{ question: 'Can my child call me from the device?', answer: 'Yes, it supports two-way calling to up to 3 pre-set numbers.' }],
      warranty: '1 Year Manufacturer Warranty',
      requiresInstallation: false,
      requiresSubscription: true,
      stock: 45,
      newArrival: true,
      featured: true,
    },
    {
      name: 'TZ Solar Asset Tracker',
      sku: 'TZ-GPS-SA90',
      category: String(assetsTracking._id),
      shortDescription: 'Solar-powered tracker for containers and heavy equipment.',
      description: '<p>Never worry about charging again — this solar-powered tracker is built for containers, trailers and heavy equipment left outdoors for long periods.</p>',
      regularPrice: 6499,
      salePrice: 5499,
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
      features: ['Solar trickle charging', 'IP68 waterproof', 'Magnetic heavy-duty mount', 'Multi-year battery backup'],
      specifications: [
        { key: 'Charging', value: 'Solar + USB-C backup' },
        { key: 'Water/Dust Resistance', value: 'IP68' },
      ],
      whatsInTheBox: ['1x Solar Asset Tracker', 'Magnetic Mount', 'USB-C Cable'],
      faqs: [],
      warranty: '2 Year Manufacturer Warranty',
      requiresInstallation: false,
      requiresSubscription: true,
      stock: 18,
      newArrival: true,
    },
    {
      name: 'TZ Car Mobile Holder',
      sku: 'TZ-ACC-MH30',
      category: String(accessories._id),
      shortDescription: 'One-touch dashboard mobile holder with 360° rotation.',
      description: '<p>A sturdy, one-touch mobile holder for your dashboard or air vent — keep your phone secure and visible for navigation on every drive.</p>',
      regularPrice: 899,
      salePrice: 599,
      image: 'https://images.unsplash.com/photo-1592840062661-a5a7f78e2056?w=800&q=80',
      features: ['One-touch auto-lock grip', '360° rotation', 'Dashboard & air-vent mount', 'Fits 4.7"-7" phones'],
      specifications: [{ key: 'Compatibility', value: '4.7" - 7" smartphones' }],
      whatsInTheBox: ['1x Mobile Holder'],
      faqs: [],
      warranty: '3 Months Warranty',
      requiresInstallation: false,
      requiresSubscription: false,
      stock: 100,
      bestSeller: true,
    },
    {
      name: 'TZ HD Reverse Parking Camera',
      sku: 'TZ-ACC-RPC40',
      category: String(accessories._id),
      shortDescription: 'Wide-angle HD reverse camera with night vision for safer parking.',
      description:
        '<p>A wide-angle, waterproof reverse parking camera with night vision — get a clear rear view on your dashboard display every time you back up.</p>',
      regularPrice: 1599,
      salePrice: 1199,
      image: 'https://images.unsplash.com/photo-1600661653561-629509216228?w=800&q=80',
      features: ['170° wide-angle lens', 'Night vision', 'IP68 waterproof', 'Universal mount'],
      specifications: [{ key: 'Viewing Angle', value: '170°' }, { key: 'Water Resistance', value: 'IP68' }],
      whatsInTheBox: ['1x Reverse Camera', 'Mounting Kit', 'Wiring Harness'],
      faqs: [],
      warranty: '6 Months Warranty',
      requiresInstallation: true,
      requiresSubscription: false,
      stock: 60,
      newArrival: true,
    },
  ];

  for (const p of demoProducts) {
    const slug = toSlug(p.name);
    let product = await Product.findOne({ sku: p.sku });
    const payload = {
      name: p.name,
      slug,
      sku: p.sku,
      category: p.category,
      brand: brand._id,
      shortDescription: p.shortDescription,
      description: p.description,
      specifications: p.specifications,
      features: p.features,
      whatsInTheBox: p.whatsInTheBox,
      faqs: p.faqs,
      images: [{ url: p.image, isThumbnail: true, displayOrder: 0, altText: p.name }],
      regularPrice: p.regularPrice,
      salePrice: p.salePrice,
      gstPercentage: 18,
      minStockLevel: 5,
      maxOrderQuantity: 5,
      warranty: p.warranty,
      codAvailable: true,
      status: 'active' as const,
      featured: !!p.featured,
      bestSeller: !!p.bestSeller,
      newArrival: !!p.newArrival,
      requiresInstallation: p.requiresInstallation,
      requiresSubscription: p.requiresSubscription,
      comparable: true,
    };

    if (product) {
      Object.assign(product, payload);
      await product.save();
    } else {
      product = await Product.create(payload);
      await addStock({
        productId: product.id,
        quantity: p.stock,
        movementType: 'manual_addition',
        reason: 'Initial demo catalog stock',
      });
    }
  }
  console.log(`[demo] ${demoProducts.length} products ready`);

  // ---- Banners ----
  // Map/live-tracking themed photography (not generic vehicle shots) to match the product story.
  const banners = [
    {
      title: 'Real-Time GPS Tracking for Every Vehicle',
      subtitle: 'Track your car, bike or fleet live with instant alerts and 24/7 support.',
      desktopImage: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=1200&q=80',
      mobileImage: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=800&q=80',
      ctaText: 'Shop GPS Trackers',
      ctaUrl: '/products?search=GPS+Tracker',
      displayOrder: 1,
    },
    {
      title: 'Never Lose Sight of What Matters',
      subtitle: 'Wireless, wired and bike trackers — professionally installed, always on.',
      desktopImage: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=1200&q=80',
      mobileImage: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&q=80',
      ctaText: 'Explore All Products',
      ctaUrl: '/products',
      displayOrder: 2,
    },
    {
      title: 'Fleet Visibility, Anytime, Anywhere',
      subtitle: 'Live maps, route history and geofence alerts for every vehicle you manage.',
      desktopImage: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=1200&q=80',
      mobileImage: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&q=80',
      ctaText: 'See Live Tracking',
      ctaUrl: '/products',
      displayOrder: 3,
    },
  ];
  for (const b of banners) {
    await Banner.findOneAndUpdate(
      { title: b.title },
      { ...b, status: 'active', startDate: new Date('2026-01-01'), endDate: new Date('2027-01-01') },
      { upsert: true }
    );
  }
  console.log('[demo] Banners ready');

  // ---- Offer ----
  await Offer.findOneAndUpdate(
    { title: 'Festive Sale on GPS Trackers' },
    {
      title: 'Festive Sale on GPS Trackers',
      type: 'category',
      discountValue: 20,
      applicableCategories: [carGps._id, busGps._id],
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'active',
      displayOrder: 1,
    },
    { upsert: true }
  );
  console.log('[demo] Offer ready');

  // ---- FAQs ----
  const faqs = [
    { question: 'How does TrackingZoom work?', answer: 'TrackingZoom uses GPS satellites to determine the exact real-time location of your vehicle or asset, and securely sends that data to your smartphone, tablet or web dashboard so you can view live position, routes and alerts anytime.', displayOrder: 1 },
    { question: 'How accurate is GPS tracking?', answer: 'Our trackers provide location accuracy within 5-10 meters under normal conditions with 4G connectivity.', displayOrder: 2 },
    { question: 'What devices are compatible with TrackingZoom?', answer: 'Our GPS trackers work with cars, bikes, buses, trucks, and other assets. The companion app and web dashboard are available on Android, iOS and any modern web browser.', displayOrder: 3 },
    { question: 'Do I need a separate SIM card?', answer: 'No, our devices come with an embedded connectivity plan managed through your subscription.', displayOrder: 4 },
    { question: 'Can I track multiple vehicles/assets with one TrackingZoom account?', answer: 'Yes, you can register and monitor multiple devices — cars, bikes, buses or assets — together from a single account dashboard.', displayOrder: 5 },
    { question: 'What happens if the GPS signal is lost?', answer: 'The device stores its last known location and automatically resumes live updates once GPS or network signal is restored. You will see a "Signal Lost" status on the dashboard in the meantime.', displayOrder: 6 },
    { question: 'How do I install the TrackingZoom device?', answer: 'Wireless trackers are plug-and-play — no installation needed. Wired trackers require a short professional installation, which you can book from your account after purchase; our certified technician will fit it at your location.', displayOrder: 7 },
    { question: 'How do I get alerts and notifications?', answer: 'Once your device is active, you can turn on push, SMS or email alerts from Account > Notifications for events like geofence exit, ignition on/off, low battery, and speed limit breaches.', displayOrder: 8 },
    { question: 'What happens if my subscription expires?', answer: 'Tracking pauses after a grace period. You can renew anytime from Account > Subscriptions.', displayOrder: 9 },
    { question: 'Is professional installation available in my city?', answer: 'Installation booking is available pan-India; enter your pincode at checkout to confirm serviceability.', displayOrder: 10 },
  ];
  for (const f of faqs) {
    await FAQ.findOneAndUpdate({ question: f.question }, { ...f, status: 'active' }, { upsert: true });
  }
  console.log('[demo] FAQs ready');

  // ---- Blog ----
  const blogCategory = await BlogCategory.findOneAndUpdate(
    { slug: 'vehicle-safety' },
    { name: 'Vehicle Safety', slug: 'vehicle-safety', status: 'active' },
    { upsert: true, new: true }
  );

  const blogs = [
    {
      title: '5 Reasons Every Vehicle Owner Needs a GPS Tracker',
      excerpt: 'From theft recovery to fuel savings, here is why GPS tracking has become essential for vehicle owners.',
      featuredImage: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1000&q=80',
      content:
        '<p>GPS trackers have moved from a fleet-only tool to an everyday essential for personal vehicle owners. Here are five reasons to consider one:</p><h3>1. Theft Recovery</h3><p>Real-time location data dramatically increases the chances of recovering a stolen vehicle.</p><h3>2. Peace of Mind for Families</h3><p>Keep track of vehicles used by family members, especially teen drivers.</p><h3>3. Lower Insurance Premiums</h3><p>Many insurers offer discounts for vehicles fitted with tracking devices.</p><h3>4. Driving Behavior Insights</h3><p>Harsh braking and speeding alerts help build safer driving habits.</p><h3>5. Easy Fleet Management</h3><p>For small business owners, tracking multiple vehicles from one dashboard simplifies operations.</p>',
    },
    {
      title: 'Wired vs Wireless GPS Trackers: Which One Should You Choose?',
      excerpt: 'A quick comparison to help you decide between a plug-and-play or professionally installed tracker.',
      featuredImage: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1000&q=80',
      content:
        '<p>Choosing between a wired and wireless GPS tracker depends on your use case.</p><h3>Wireless Trackers</h3><p>Battery-powered, magnetic mount, no installation needed — ideal for temporary tracking or rental vehicles.</p><h3>Wired Trackers</h3><p>Hardwired to the vehicle battery for continuous power and advanced features like remote immobilization — best for daily drivers and fleets.</p>',
    },
  ];
  for (const b of blogs) {
    const slug = toSlug(b.title);
    await Blog.findOneAndUpdate(
      { slug },
      {
        ...b,
        slug,
        category: blogCategory._id,
        author: 'TrackingZoom Team',
        status: 'published',
        publishedAt: new Date(),
        tags: ['gps-tracking', 'vehicle-safety'],
        readingTimeMinutes: 4,
      },
      { upsert: true }
    );
  }
  console.log('[demo] Blog posts ready');

  console.log('[demo] Done. All demo content uses placeholder stock photography — replace with real product/brand photos from Admin before launch.');
  await disconnectDB();
  process.exit(0);
}

main().catch((err) => {
  console.error('[demo] Failed:', err);
  process.exit(1);
});
