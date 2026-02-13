import { Router } from 'express';
import { register, verifyEmail, login, forgotPassword, resetPassword, logout } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token',protect , resetPassword);
router.post('/logout', protect, logout);

export default router;
