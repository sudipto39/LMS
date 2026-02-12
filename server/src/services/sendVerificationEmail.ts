import { resend } from "../config/resend.js";
interface VerificationEmailProps {
  to: string;
  code: string;
}

export const emailService = {
  async sendVerificationEmail({ to, code }: VerificationEmailProps) {
    const { data, error } = await resend.emails.send({
      from: 'no-reply@yourdomain.com',  // Your verified domain
      to: [to],
      subject: 'Verify your email - YourApp',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>Verify Your Email</h2>
          <p>Your verification code is:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; letter-spacing: 5px;">
            ${code}
          </div>
          <p>This code expires in 10 minutes.</p>
        </div>
      `,
    });

    if (error) {
      throw new Error(`Email failed: ${error.message}`);
    }

    return data;
  }
};
