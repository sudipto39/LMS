// src/services/sendVerificationEmail.ts
import { resend } from "../config/resend.js";
import { env } from "../config/env.js";

const FROM_EMAIL = "no-reply@giteaforge.com";
const APP_NAME = "GiteaForge";

interface VerificationEmailProps {
  to: string;
  name: string;
  code: string;
}

interface PasswordResetEmailProps {
  to: string;
  name: string;
  code: string;
}

export const emailService = {
  async sendVerificationEmail({ to, name, code }: VerificationEmailProps) {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Verify your email — ${APP_NAME}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ${APP_NAME}, ${name}!</h2>
          <p>Please verify your email address using the code below:</p>
          <div style="background: #f4f4f4; padding: 24px; text-align: center;
                      font-size: 32px; letter-spacing: 8px; font-weight: bold;
                      border-radius: 8px; margin: 24px 0;">
            ${code}
          </div>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p>If you did not create an account, please ignore this email.</p>
        </div>
      `,
    });

    if (error) throw new Error(`Verification email failed: ${error.message}`);
  },

  async sendPasswordResetEmail({ to, name, code }: PasswordResetEmailProps) {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Reset your password — ${APP_NAME}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hi ${name}, use the code below to reset your password:</p>
          <div style="background: #f4f4f4; padding: 24px; text-align: center;
                      font-size: 32px; letter-spacing: 8px; font-weight: bold;
                      border-radius: 8px; margin: 24px 0;">
            ${code}
          </div>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
        </div>
      `,
    });

    if (error) throw new Error(`Password reset email failed: ${error.message}`);
  },
};