import { Resend } from "resend";
import { env } from "./env.js";

let _resend: Resend | null = null;

export const getResend = (): Resend => {
  if (_resend) return _resend;

  if (!env.RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY is required when EMAIL_VERIFICATION is enabled"
    );
  }

  _resend = new Resend(env.RESEND_API_KEY);
  return _resend;
};