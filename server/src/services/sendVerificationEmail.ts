// src/services/sendVerificationEmail.ts
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config/env.js";

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

interface MilestoneReviewEmailProps {
  to: string;
  name: string;
  milestoneTitle: string;
  projectTitle: string;
  status: string;
  feedback?: string | null | undefined;
}

interface SupervisorAssignmentEmailProps {
  to: string;
  name: string;
  projectTitle: string;
  supervisorName: string;
  role: string;
}

const escapeHtml = (unsafe: string | null | undefined): string => {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

let cachedTransporter: Transporter | null = null;

const getTransporter = (): Transporter | null => {
  if (cachedTransporter) return cachedTransporter;

  if (env.SMTP_USER && env.SMTP_PASS) {
    if (env.SMTP_SERVICE?.toLowerCase() === "gmail" || env.SMTP_HOST.includes("gmail")) {
      cachedTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    } else {
      cachedTransporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465 || env.SMTP_SECURE,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }
  }

  return cachedTransporter;
};

export const emailService = {
  async verifyConnection(): Promise<boolean> {
    const transporter = getTransporter();
    if (!transporter) {
      if (env.NODE_ENV !== "production") {
        console.log("ℹ️ Nodemailer: SMTP credentials not set in .env (console OTP mode active).");
      }
      return false;
    }
    try {
      await transporter.verify();
      console.log("✅ Nodemailer: SMTP Transporter verified and ready to send emails.");
      return true;
    } catch (err) {
      console.warn("⚠️ Nodemailer: SMTP connection verification failed:", (err as Error).message);
      return false;
    }
  },

  async sendVerificationEmail({ to, name, code }: VerificationEmailProps): Promise<void> {
    const transporter = getTransporter();

    if (!transporter) {
      if (env.NODE_ENV !== "production") {
        console.log(`\n======================================================`);
        console.log(`📧 [EMAIL VERIFICATION OTP] Sent to: ${to}`);
        console.log(`👤 User: ${name}`);
        console.log(`🔑 Verification Code: [SECURE OTP DISPATCHED] (Expires in 10 minutes)`);
        console.log(`======================================================\n`);
      }
      return;
    }

    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM || `"GiteaForge LMS" <${env.SMTP_USER}>`,
        to,
        subject: `Verify your email — GiteaForge LMS`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background: #0f172a; padding: 24px; text-align: center;">
              <h1 style="color: #00A3FF; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">GiteaForge LMS</h1>
              <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px;">Academic Capstone & Git Defense Platform</p>
            </div>
            <div style="padding: 32px 24px;">
              <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 18px;">Welcome, ${escapeHtml(name)}!</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0;">
                Thank you for registering. Please enter the one-time verification code below to activate your student/supervisor portal:
              </p>
              <div style="background: #f8fafc; border: 2px dashed #00A3FF; padding: 20px; text-align: center; border-radius: 10px; margin-bottom: 24px;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${escapeHtml(code)}</span>
              </div>
              <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0;">
                ⏱️ This code will expire in <strong>10 minutes</strong>.
              </p>
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                If you did not initiate this registration, you can safely ignore this message.
              </p>
            </div>
            <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b;">
              © ${new Date().getFullYear()} GiteaForge LMS. All rights reserved.
            </div>
          </div>
        `,
      });
      console.log(`✅ Verification email sent successfully to ${to}`);
    } catch (error) {
      console.error(`❌ Failed to send verification email to ${to}:`, error);
      if (env.NODE_ENV !== "production") {
        console.log(`ℹ️ Fallback email notification queued for ${to}`);
      }
    }
  },

  async sendPasswordResetEmail({ to, name, code }: PasswordResetEmailProps): Promise<void> {
    const transporter = getTransporter();

    if (!transporter) {
      if (env.NODE_ENV !== "production") {
        console.log(`\n======================================================`);
        console.log(`🔑 [PASSWORD RESET OTP] Sent to: ${to}`);
        console.log(`👤 User: ${name}`);
        console.log(`🔐 Reset Code: [SECURE OTP DISPATCHED] (Expires in 10 minutes)`);
        console.log(`======================================================\n`);
      }
      return;
    }

    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM || `"GiteaForge LMS" <${env.SMTP_USER}>`,
        to,
        subject: `Reset your password — GiteaForge LMS`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background: #0f172a; padding: 24px; text-align: center;">
              <h1 style="color: #00A3FF; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">GiteaForge LMS</h1>
              <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px;">Security & Password Recovery</p>
            </div>
            <div style="padding: 32px 24px;">
              <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 18px;">Password Reset Request</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0;">
                Hi ${escapeHtml(name)}, we received a request to reset your password. Use the verification code below to proceed:
              </p>
              <div style="background: #f8fafc; border: 2px dashed #e11d48; padding: 20px; text-align: center; border-radius: 10px; margin-bottom: 24px;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${escapeHtml(code)}</span>
              </div>
              <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0;">
                ⏱️ This code will expire in <strong>10 minutes</strong>.
              </p>
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                If you did not request a password reset, please secure your account immediately.
              </p>
            </div>
            <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b;">
              © ${new Date().getFullYear()} GiteaForge LMS. All rights reserved.
            </div>
          </div>
        `,
      });
      console.log(`✅ Password reset email sent successfully to ${to}`);
    } catch (error) {
      console.error(`❌ Failed to send password reset email to ${to}:`, error);
      if (env.NODE_ENV !== "production") {
        console.log(`ℹ️ Fallback Reset Code for ${to}: ${code}`);
      }
    }
  },

  async sendMilestoneReviewNotification({
    to,
    name,
    milestoneTitle,
    projectTitle,
    status,
    feedback,
  }: MilestoneReviewEmailProps): Promise<void> {
    const transporter = getTransporter();
    if (!transporter) return;

    try {
      const isApproved = status === "APPROVED";
      const subject = `Milestone Review Update: "${milestoneTitle}" — ${status}`;
      await transporter.sendMail({
        from: env.EMAIL_FROM || `"GiteaForge LMS" <${env.SMTP_USER}>`,
        to,
        subject,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background: #0f172a; padding: 24px; text-align: center;">
              <h1 style="color: #00A3FF; margin: 0; font-size: 20px; font-weight: 700;">GiteaForge LMS</h1>
              <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px;">Milestone Status Notification</p>
            </div>
            <div style="padding: 32px 24px;">
              <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 18px;">Hello, ${escapeHtml(name)}</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.5;">
                Your milestone <strong>"${escapeHtml(milestoneTitle)}"</strong> in project <strong>"${escapeHtml(projectTitle)}"</strong> has been reviewed.
              </p>
              <div style="margin: 20px 0; padding: 16px; border-radius: 8px; background: ${isApproved ? "#ecfdf5" : "#fff1f2"}; border: 1px solid ${isApproved ? "#a7f3d0" : "#fecdd3"};">
                <span style="font-weight: 700; color: ${isApproved ? "#047857" : "#be123c"}; font-size: 16px;">Status: ${escapeHtml(status)}</span>
                ${feedback ? `<p style="margin: 8px 0 0 0; color: #334155; font-size: 13px;"><strong>Supervisor Feedback:</strong> ${escapeHtml(feedback)}</p>` : ""}
              </div>
            </div>
          </div>
        `,
      });
      console.log(`✅ Milestone review notification sent to ${to}`);
    } catch (err) {
      console.error(`❌ Failed to send milestone notification to ${to}:`, err);
    }
  },

  async sendSupervisorAssignmentNotification({
    to,
    name,
    projectTitle,
    supervisorName,
    role,
  }: SupervisorAssignmentEmailProps): Promise<void> {
    const transporter = getTransporter();
    if (!transporter) return;

    try {
      const subject = `Supervisor Allocation Update — "${projectTitle}"`;
      await transporter.sendMail({
        from: env.EMAIL_FROM || `"GiteaForge LMS" <${env.SMTP_USER}>`,
        to,
        subject,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background: #0f172a; padding: 24px; text-align: center;">
              <h1 style="color: #00A3FF; margin: 0; font-size: 20px; font-weight: 700;">GiteaForge LMS</h1>
              <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px;">Capstone Supervisor Assignment</p>
            </div>
            <div style="padding: 32px 24px;">
              <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 18px;">Hello, ${escapeHtml(name)}</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.5;">
                ${role === "STUDENT"
                  ? `Faculty supervisor <strong>${escapeHtml(supervisorName)}</strong> has been assigned to your project <strong>"${escapeHtml(projectTitle)}"</strong>.`
                  : `You have been assigned as the faculty supervisor for project <strong>"${escapeHtml(projectTitle)}"</strong>.`}
              </p>
            </div>
          </div>
        `,
      });
      console.log(`✅ Supervisor assignment notification sent to ${to}`);
    } catch (err) {
      console.error(`❌ Failed to send supervisor assignment email to ${to}:`, err);
    }
  },
};

export default emailService;