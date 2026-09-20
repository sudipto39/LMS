import React, { useState } from "react";
import { KeyRound, CheckCircle2, Check, Eye, EyeOff } from "lucide-react";
import { Inp, Btn, PasswordStrengthMeter } from "../common/UIPrimitives";
import { authApi } from "../../api";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { checkRateLimit } from "../../utils/security";

interface ResetPasswordFormProps {
  email: string;
  onSuccess: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  email,
  onSuccess,
}) => {
  const { t } = useTheme();
  const showToast = useToast();

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      showToast("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      showToast("New password must be at least 8 characters long");
      return;
    }
    const { allowed, retryAfter } = checkRateLimit("reset_password_attempt", 5, 60000);
    if (!allowed) {
      showToast(`Too many attempts. Please wait ${retryAfter}s before retrying.`);
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        password: newPassword,
        confirmPassword,
      });
      showToast("Password reset successful! Please sign in with your new password. ✅");
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Invalid or expired reset token.";
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          className="text-[11px] font-bold tracking-widest uppercase flex items-center gap-1.5 mb-2"
          style={{ color: t.t2 }}
        >
          <KeyRound size={12} /> Reset Token / Code
        </label>
        <Inp
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter 6-digit token"
          required
        />
      </div>

      <div>
        <label
          className="text-[11px] font-bold tracking-widest uppercase flex items-center gap-1.5 mb-2"
          style={{ color: t.t2 }}
        >
          <KeyRound size={12} /> New Password
        </label>
        <div className="relative">
          <Inp
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 8 characters"
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
            style={{ color: t.t2 }}
            tabIndex={-1}
            aria-label={showNewPassword ? "Hide password" : "Show password"}
          >
            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <PasswordStrengthMeter password={newPassword} />
      </div>

      <div>
        <label
          className="text-[11px] font-bold tracking-widest uppercase flex items-center gap-1.5 mb-2"
          style={{ color: t.t2 }}
        >
          <CheckCircle2 size={12} /> Confirm New Password
        </label>
        <div className="relative">
          <Inp
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
            style={{ color: t.t2 }}
            tabIndex={-1}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <Btn
        type="submit"
        disabled={loading}
        className="w-full justify-center h-11 text-[13px]"
      >
        {loading ? "Updating..." : "Update Password & Sign In"}{" "}
        <Check size={14} />
      </Btn>
    </form>
  );
};

export default ResetPasswordForm;
