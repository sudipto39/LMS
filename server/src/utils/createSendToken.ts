import jwt, { Secret } from 'jsonwebtoken';
import { Response } from 'express';
import { User } from '../models/userModel.js'; // Adjust path to your User model


declare module 'jsonwebtoken' {
  function sign(payload: any, secret: string, options?: any): string;
}

const JWT_SECRET: string = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN!;  // ← FIXED

const signToken = (id: string): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(
    { id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }  // Now TypeScript happy!
  );
};


// Send token in both JWT response AND httpOnly cookie
// const createSendToken = (user: User, statusCode: number, res: Response): void => {
//   const token = signToken(user._id.toString());
  
//   const cookieOptions: any = {
//     expires: new Date(
//       Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '90') * 24 * 60 * 60 * 1000)
//     ),
//     httpOnly: true,  // Prevents XSS (document.cookie access)
//     sameSite: 'strict'  // CSRF protection
//   };
  
//   if (process.env.NODE_ENV === 'production') {
//     cookieOptions.secure = true;  // HTTPS only
//   }

//   // Set httpOnly cookie
//   res.cookie('jwt', token, cookieOptions);

//   // Remove password from response
//   const userObj = {
//     ...user.toObject(),
//     password: undefined
//   };

//   // Send JSON response with token
//   res.status(statusCode).json({
//     status: 'success',
//     token,
//     data: { user: userObj }
//   });
// };

const createSendToken = (
  user: User,
  statusCode: number,
  res: Response
): Response => {
  const token = signToken(user._id.toString());

  const cookieOptions: any = {
    expires: new Date(
      Date.now() +
        parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '90') *
          24 *
          60 *
          60 *
          1000
    ),
    httpOnly: true,
    sameSite: 'strict',
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);

  const userObj = {
    ...user.toObject(),
    password: undefined,
  };

  return res.status(statusCode).json({
    status: 'success',
    token,
    data: { user: userObj },
  });
};


export { signToken, createSendToken };
