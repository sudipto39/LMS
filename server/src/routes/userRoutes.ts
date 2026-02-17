// user.route.ts
import { Router } from 'express';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import {
  getMe,
  updateMe,
  getAllUsers,
  getUserById,
  getMyStudents,
} from '../controllers/userController.js';

const router = Router();

router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);
router.get('/getAllUsers', protect, restrictTo('admin'), getAllUsers);
router.get('/myStudents', protect, restrictTo('projectSupervisor'), getMyStudents);
router.get('/:id', protect, restrictTo('admin', 'projectSupervisor'), getUserById);

export default router;
