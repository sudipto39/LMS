import express from 'express';
import {
  createMilestone,
  getProjectMilestones,
  submitMilestone,
  approveMilestone,
  rejectMilestone,
  getMySubmissions,
} from '../controllers/milestoneController.js';

import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post(
  '/projects/:projectId/milestones',
  protect,
  createMilestone
);

router.get(
  '/projects/:projectId/milestones',
  protect,
  getProjectMilestones
);

router.patch(
  '/milestones/:id/submit',
  protect,
  restrictTo('student'),
  submitMilestone
);

router.patch(
  '/milestones/:id/approve',
  protect,
  restrictTo('projectSupervisor', 'admin'),
  approveMilestone
);

router.patch(
  '/milestones/:id/reject',
  protect,
  restrictTo('projectSupervisor', 'admin'),
  rejectMilestone
);

router.get(
  '/me/submissions',
  protect,
  restrictTo('student'),
  getMySubmissions
);

export default router;
