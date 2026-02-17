import { Router } from 'express';
import {
  getMyActivity,
  getProjectActivity,
  getSupervisorActivity,
  getAdminActivity,
} from '../controllers/activityController.js';

import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

// Student
router.get('/me', protect, getMyActivity);

// Project timeline
router.get('/project/:projectId', protect, getProjectActivity);

// Supervisor
router.get(
  '/supervisor',
  protect,
  restrictTo('projectSupervisor'),
  getSupervisorActivity
);

// Admin
router.get(
  '/admin',
  protect,
  restrictTo('admin'),
  getAdminActivity
);

export default router;
