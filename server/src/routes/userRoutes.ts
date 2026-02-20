import { Router } from 'express';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import {
  getMe,
  updateMe,
  getAllUsers,
  getUserById,
} from '../controllers/userController.js';

const router = Router();

router.get('/me', protect, getMe);
router.patch('/updateMe', protect, updateMe);
router.get('/getAllUsers', protect, restrictTo('admin'), getAllUsers);
router.get('/:id', protect, restrictTo('admin'), getUserById);

export default router;
