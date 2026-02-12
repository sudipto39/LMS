import dotenv from 'dotenv';
dotenv.config();
const parsedPort = Number(process.env.PORT);

export const config = {
  EMAIL_VERIFICATION: process.env.EMAIL_VERIFICATION === 'true',
  JWT_SECRET: process.env.JWT_SECRET!,
  MONGODB_URI: process.env.MONGODB_URI!,
  NODE_ENV: process.env.NODE_ENV,
  PORT: Number.isInteger(parsedPort) ? parsedPort : 5000,
  CLIENT_URL: process.env.CLIENT_URL!,
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
} as const;
