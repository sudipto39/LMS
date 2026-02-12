import User from '../models/userModel.js';  // Your User model
import { emailService } from './sendVerificationEmail.js';

export const authService = {
  async registerUser(userData: any) {
    // Create user with verifyCode
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const user = new User({
      ...userData,
      verifyCode,
      verifyCodeExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    });
    
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail({
      to: user.email,
      code: verifyCode,
    });

    return { userId: user._id, message: 'Verification email sent' };
  }
};
