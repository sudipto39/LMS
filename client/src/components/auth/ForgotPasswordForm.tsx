import React, { useState } from "react";
import { Mail, ArrowRight } from "lucide-react";
import { Inp, Btn } from "../common/UIPrimitives";
import { authApi } from "../../api";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { validateEmail, checkRateLimit } from "../../utils/security";

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
  onCodeSent: (email: string) => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBackToLogin,
  onCodeSent,
}) => {
  const { dark, t } = useTheme();
  const showToast = useToast();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast("Please enter your registered email address");
      return;
    }
    const emailCheck = validateEmail(email.trim());
    if (!emailCheck.valid) {
      showToast(emailCheck.error);
      return;
    }
    const { allowed, retryAfter } = checkRateLimit("forgot_password_attempt", 3, 60000);
    if (!allowed) {
      showToast(`Too many password reset requests. Please wait ${retryAfter}s.`);
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      showToast("Reset code sent to your email! 📩");
      onCodeSent(email.trim().toLowerCase());
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to send reset code. Please verify email.";
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        className="rounded-xl p-3"
        style={{
          background: dark ? "rgba(34,211,238,0.08)" : "rgba(8,145,178,0.06)",
          border: "1px solid",
          borderColor: t.acc,
        }}
      >
        <div className="text-[12px] font-medium" style={{ color: t.t1 }}>
          We will send a password reset code to your university email address.
        </div>
      </div>

      <div>
        <label
          className="text-[11px] font-bold tracking-widest uppercase flex items-center gap-1.5 mb-2"
          style={{ color: t.t2 }}
        >
          <Mail size={12} /> University Email
        </label>
        <Inp
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="alex@univ.edu"
          required
        />
      </div>

      <Btn
        type="submit"
        disabled={loading}
        className="w-full justify-center h-12 text-[13px]"
      >
        {loading ? "Sending..." : "Send Reset Code"} <ArrowRight size={14} />
      </Btn>

      <button
        type="button"
        onClick={onBackToLogin}
        className="w-full text-center text-[12px] hover:underline pt-2 cursor-pointer"
        style={{ color: t.t2 }}
      >
        ← Back to Sign In
      </button>
    </form>
  );
};

export default ForgotPasswordForm;
