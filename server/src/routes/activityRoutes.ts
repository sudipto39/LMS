import { Router } from 'express';
import {
  getMyActivity,
  getProjectActivity,
  getSupervisorActivity,
  getAdminActivity,
} from '../controllers/activityController.js';

import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/me', protect, getMyActivity);
router.get('/project/:projectId', protect, getProjectActivity);
router.get(
  '/supervisor',
  protect,
  restrictTo('projectSupervisor'),
  getSupervisorActivity
);

router.get(
  '/admin',
  protect,
  restrictTo('admin'),
  getAdminActivity
);

export default router;
