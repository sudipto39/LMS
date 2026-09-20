import React, { useState } from "react";
import { Mail, KeyRound, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Inp, Btn } from "../common/UIPrimitives";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { validateEmail, checkRateLimit } from "../../utils/security";

interface LoginFormProps {
  onForgotPassword: () => void;
  onSuccess: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onForgotPassword,
  onSuccess,
}) => {
  const { login } = useAuth();
  const { t } = useTheme();
  const showToast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast("Please enter your email and password");
      return;
    }
    const emailCheck = validateEmail(email.trim());
    if (!emailCheck.valid) {
      showToast(emailCheck.error);
      return;
    }
    const { allowed, retryAfter } = checkRateLimit("login_attempt", 5, 60000);
    if (!allowed) {
      showToast(`Too many login attempts. Please wait ${retryAfter}s before retrying.`);
      return;
    }
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      showToast("Welcome back! Authentication successful 🚀");
      onSuccess();
    } catch (err: any) {
      showToast(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          className="text-[11px] font-bold tracking-widest uppercase flex items-center gap-1.5 mb-2"
          style={{ color: t.t2 }}
        >
          <Mail size={12} /> Email
        </label>
        <Inp
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@university.edu"
          required
        />
      </div>

      <div>
        <label
          className="text-[11px] font-bold tracking-widest uppercase flex items-center gap-1.5 mb-2"
          style={{ color: t.t2 }}
        >
          <KeyRound size={12} /> Password
        </label>
        <div className="relative">
          <Inp
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
            style={{ color: t.t2 }}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <Btn
        type="submit"
        disabled={loading}
        className="w-full justify-center h-12 text-[14px]"
      >
        {loading ? (
          "Authenticating..."
        ) : (
          <>
            Sign In to Platform <ArrowRight size={16} />
          </>
        )}
      </Btn>

      <div
        className="flex items-center justify-between text-[12px] pt-1"
        style={{ color: t.t2 }}
      >
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="rounded" defaultChecked /> Remember me
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="hover:underline cursor-pointer"
          style={{ color: t.acc }}
        >
          Forgot password?
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
