import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import * as controller from '../controllers/blog.controller';

const router = Router();

router.get('/', controller.listBlogs);

router.get('/admin/all', requireAdminAuth, requirePermission('blogs.create'), controller.adminListBlogs);
router.get('/admin/:id', requireAdminAuth, requirePermission('blogs.create'), controller.adminGetBlog);
router.post(
  '/admin',
  requireAdminAuth,
  requirePermission('blogs.create'),
  [body('title').trim().notEmpty(), body('category').isMongoId(), body('content').trim().notEmpty()],
  validate,
  controller.createBlog
);
router.patch('/admin/:id', requireAdminAuth, requirePermission('blogs.edit'), controller.updateBlog);
router.delete('/admin/:id', requireAdminAuth, requirePermission('blogs.delete'), controller.deleteBlog);

router.get('/:slug', controller.getBlogBySlug);

export default router;
