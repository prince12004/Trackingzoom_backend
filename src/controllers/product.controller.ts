import { Request, Response } from 'express';
import { FilterQuery } from 'mongoose';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess, buildPagination } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Product, IProduct } from '../models/Product';
import { ProductVariant } from '../models/ProductVariant';
import { Category } from '../models/Category';
import { toSlug, ensureUniqueSlug } from '../utils/slug';
import { addStock } from '../services/inventory.service';

function effectivePrice(p: { regularPrice: number; salePrice?: number }) {
  return p.salePrice && p.salePrice < p.regularPrice ? p.salePrice : p.regularPrice;
}

export const listProducts = catchAsync(async (req: Request, res: Response) => {
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    search,
    sort,
    page = '1',
    limit = '20',
    featured,
    bestSeller,
    newArrival,
    inStock,
  } = req.query as Record<string, string>;

  const filter: FilterQuery<IProduct> = { status: 'active' };

  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (cat) {
      const children = await Category.find({ parent: cat._id }).select('_id');
      const ids = [cat._id, ...children.map((c) => c._id)];
      filter.$or = [{ category: { $in: ids } }, { subCategory: { $in: ids } }];
    } else {
      filter.category = null;
    }
  }

  if (brand) {
    const brandSlugs = brand.split(',');
    const brandDocs = await Category.db.model('Brand').find({ slug: { $in: brandSlugs } }).select('_id');
    filter.brand = { $in: brandDocs.map((b: { _id: unknown }) => b._id) };
  }

  if (featured === 'true') filter.featured = true;
  if (bestSeller === 'true') filter.bestSeller = true;
  if (newArrival === 'true') filter.newArrival = true;
  if (inStock === 'true') filter.stockQuantity = { $gt: 0 };

  if (minPrice || maxPrice) {
    filter.regularPrice = {};
    if (minPrice) filter.regularPrice.$gte = Number(minPrice);
    if (maxPrice) filter.regularPrice.$lte = Number(maxPrice);
  }

  if (search) {
    filter.$text = { $search: search };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  let sortSpec: Record<string, 1 | -1> = { createdAt: -1 };
  switch (sort) {
    case 'price_asc':
      sortSpec = { regularPrice: 1 };
      break;
    case 'price_desc':
      sortSpec = { regularPrice: -1 };
      break;
    case 'rating':
      sortSpec = { ratingAverage: -1 };
      break;
    case 'best_selling':
      sortSpec = { soldCount: -1 };
      break;
    case 'newest':
      sortSpec = { createdAt: -1 };
      break;
    case 'popular':
    default:
      sortSpec = { ratingCount: -1, soldCount: -1 };
  }

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .sort(sortSpec)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  sendSuccess(res, items, 'Products fetched', 200, buildPagination(pageNum, limitNum, total));
});

export const getProductBySlug = catchAsync(async (req: Request, res: Response) => {
  const product = await Product.findOne({ slug: req.params.slug, status: 'active' })
    .populate('category', 'name slug')
    .populate('subCategory', 'name slug')
    .populate('brand', 'name slug logo');
  if (!product) throw ApiError.notFound('Product not found');

  const variants = await ProductVariant.find({ product: product._id, status: 'active' });

  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    status: 'active',
  })
    .limit(8)
    .select('name slug images regularPrice salePrice ratingAverage ratingCount');

  sendSuccess(res, { product, variants, relatedProducts: related });
});

export const searchAutocomplete = catchAsync(async (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  if (q.length < 2) return sendSuccess(res, []);

  const products = await Product.find({
    status: 'active',
    $text: { $search: q },
  })
    .select('name slug images regularPrice salePrice')
    .limit(8);

  sendSuccess(res, products);
});

// ---- Admin ----

export const adminListProducts = catchAsync(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', status, search } = req.query as Record<string, string>;
  const filter: FilterQuery<IProduct> = {};
  if (status) filter.status = status;
  if (search) filter.$or = [
    { name: new RegExp(search, 'i') },
    { sku: new RegExp(search, 'i') },
  ];

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name')
      .populate('brand', 'name')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  sendSuccess(res, items, 'Products fetched', 200, buildPagination(pageNum, limitNum, total));
});

export const adminGetProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id).populate('category').populate('brand');
  if (!product) throw ApiError.notFound('Product not found');
  const variants = await ProductVariant.find({ product: product._id });
  sendSuccess(res, { product, variants });
});

export const createProduct = catchAsync(async (req: Request, res: Response) => {
  const body = req.body;
  const baseSlug = body.slug ? toSlug(body.slug) : toSlug(body.name);
  const slug = await ensureUniqueSlug(baseSlug, async (s) => !!(await Product.findOne({ slug: s })));

  const existingSku = await Product.findOne({ sku: body.sku });
  if (existingSku) throw ApiError.conflict('A product with this SKU already exists');

  const product = await Product.create({ ...body, slug });

  if (body.stockQuantity && body.stockQuantity > 0) {
    await addStock({
      productId: product.id,
      quantity: body.stockQuantity,
      movementType: 'manual_addition',
      adminId: req.adminId,
      reason: 'Initial stock on product creation',
    });
  }

  sendSuccess(res, product, 'Product created', 201);
});

export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  const body = { ...req.body };
  delete body.stockQuantity; // stock changes must go through inventory endpoints for audit trail

  if (body.name && body.name !== product.name && !body.slug) {
    const baseSlug = toSlug(body.name);
    body.slug = await ensureUniqueSlug(
      baseSlug,
      async (s) => !!(await Product.findOne({ slug: s, _id: { $ne: product.id } }))
    );
  }

  Object.assign(product, body);
  await product.save();
  sendSuccess(res, product, 'Product updated');
});

export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
  if (!product) throw ApiError.notFound('Product not found');
  sendSuccess(res, null, 'Product deactivated');
});

// ---- Variants ----

export const createVariant = catchAsync(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.productId);
  if (!product) throw ApiError.notFound('Product not found');

  const variant = await ProductVariant.create({ ...req.body, product: product._id });

  if (req.body.stockQuantity && req.body.stockQuantity > 0) {
    await addStock({
      productId: product.id,
      variantId: variant.id,
      quantity: req.body.stockQuantity,
      movementType: 'manual_addition',
      adminId: req.adminId,
      reason: 'Initial stock on variant creation',
    });
  }

  sendSuccess(res, variant, 'Variant created', 201);
});

export const updateVariant = catchAsync(async (req: Request, res: Response) => {
  const body = { ...req.body };
  delete body.stockQuantity;
  const variant = await ProductVariant.findByIdAndUpdate(req.params.variantId, body, { new: true });
  if (!variant) throw ApiError.notFound('Variant not found');
  sendSuccess(res, variant, 'Variant updated');
});

export const deleteVariant = catchAsync(async (req: Request, res: Response) => {
  const variant = await ProductVariant.findByIdAndUpdate(
    req.params.variantId,
    { status: 'inactive' },
    { new: true }
  );
  if (!variant) throw ApiError.notFound('Variant not found');
  sendSuccess(res, null, 'Variant deactivated');
});

export { effectivePrice };
