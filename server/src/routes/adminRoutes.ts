import { Router } from 'express';
import {
  assignSupervisorToProject,
  getAllProjectsForAdmin,
  getAdminStats,
} from '../controllers/adminController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

router.get(
  '/stats',
  protect,
  restrictTo('admin'),
  getAdminStats
);

router.get(
  '/projects',
  protect,
  restrictTo('admin'),
  getAllProjectsForAdmin
);

router.patch(
  '/projects/:id/assign-supervisor',
  protect,
  restrictTo('admin'),
  assignSupervisorToProject
);

export default router;
