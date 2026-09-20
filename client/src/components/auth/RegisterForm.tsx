// src/components/auth/RegisterForm.tsx
import React, { useState } from "react";
import {
  CheckCircle2,
  User,
  Mail,
  KeyRound,
  Hash,
  Layers,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { Inp, Btn, Btn2, PasswordStrengthMeter } from "../common/UIPrimitives";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { validateEmail, checkRateLimit } from "../../utils/security";
import type { Course, Batch } from "../../types";

interface RegisterFormProps {
  courses: Course[];
  batches: Batch[];
  onSuccess: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  courses,
  batches,
  onSuccess,
}) => {
  const { register, verifyEmail } = useAuth();
  const { dark, t } = useTheme();
  const showToast = useToast();

  const [regStep, setRegStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    universityId: "",
    courseId: courses[0]?.id || "",
    batchId: batches[0]?.id || "",
    phoneNumber: "",
    department: "CSE",
  });
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setFormData((prev) => {
      const activeCourseId = prev.courseId || courses[0]?.id || "";
      const validBatches = batches.filter(
        (b) => !activeCourseId || b.courseId === activeCourseId
      );
      const activeBatchId =
        prev.batchId && batches.some((b) => b.id === prev.batchId)
          ? prev.batchId
          : validBatches[0]?.id || batches[0]?.id || "";
      return {
        ...prev,
        courseId: activeCourseId,
        batchId: activeBatchId,
      };
    });
  }, [courses, batches]);

  const handleStep1 = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      showToast("Please fill all required account fields");
      return;
    }
    const emailCheck = validateEmail(formData.email);
    if (!emailCheck.valid) {
      showToast(emailCheck.error);
      return;
    }
    if (formData.password.length < 8) {
      showToast("Password must be at least 8 characters long");
      return;
    }
    showToast("Account credentials validated ✅");
    setRegStep(2);
  };

  const handleStep2 = async () => {
    if (!formData.universityId.trim() || !formData.phoneNumber.trim()) {
      showToast("Please fill all required academic fields");
      return;
    }
    const { allowed, retryAfter } = checkRateLimit("register_attempt", 5, 60000);
    if (!allowed) {
      showToast(`Too many attempts. Please wait ${retryAfter}s before retrying.`);
      return;
    }
    setLoading(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        universityId: formData.universityId.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        department: formData.department.trim(),
      };
      if (formData.batchId && formData.batchId.trim()) {
        payload.batchId = formData.batchId.trim();
      }
      await register(payload);
      showToast("Registration initiated — OTP code sent to your email! 📩");
      setRegStep(3);
    } catch (err: any) {
      showToast(
        err.message || "Registration failed. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpDigits.join("");
    if (code.length < 6) {
      showToast("Please enter the complete 6-digit verification code");
      return;
    }
    const { allowed, retryAfter } = checkRateLimit("otp_verification", 5, 60000);
    if (!allowed) {
      showToast(`Too many verification attempts. Please wait ${retryAfter}s.`);
      return;
    }
    setLoading(true);
    try {
      await verifyEmail({
        email: formData.email.trim().toLowerCase(),
        code,
      });
      showToast("Account verified — Welcome to GiteaForge! 🚀");
      onSuccess();
    } catch (err: any) {
      showToast(err.message || "Invalid or expired verification code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Progress Indicators */}
      <div className="flex items-center gap-1.5 mb-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div
              className={`h-7 w-7 rounded-full grid place-items-center text-[11px] font-bold transition-all ${
                s <= regStep
                  ? "bg-gradient-to-r from-[#06b6d4] to-[#2563eb] text-white shadow-[0_0_12px_rgba(6,182,214,0.4)]"
                  : ""
              }`}
              style={
                s > regStep
                  ? {
                      background: dark ? "#1c3044" : "#e6f4f8",
                      color: t.t3,
                      border: "1px solid",
                      borderColor: dark ? "#2e5065" : "#c0dde8",
                    }
                  : {}
              }
            >
              {s < regStep ? <CheckCircle2 size={13} /> : s}
            </div>
            {s < 3 && (
              <div
                className="flex-1 h-0.5 rounded-full"
                style={{
                  background:
                    s < regStep ? "var(--acc)" : dark ? "#1c3044" : "#c7e6ef",
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div
        className="text-[11px] tracking-widest uppercase font-bold"
        style={{ color: t.t2 }}
      >
        Step {regStep}/3 —{" "}
        {regStep === 1
          ? "Account"
          : regStep === 2
          ? "Academic Batch"
          : "Verify Email"}
      </div>

      {/* STEP 1: ACCOUNT DETAILS */}
      {regStep === 1 && (
        <div className="space-y-3">
          <div>
            <label
              className="text-[11px] font-bold tracking-widest uppercase flex items-center gap-1.5 mb-2"
              style={{ color: t.t2 }}
            >
              <User size={12} /> Full Name
            </label>
            <Inp
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Sarah Johnson"
              autoComplete="off"
            />
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
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="sarah.johnson@univ.edu"
              autoComplete="off"
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
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Min 8 chars, 1 number, 1 symbol"
                autoComplete="new-password"
                className="pr-10"
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
            <PasswordStrengthMeter password={formData.password} />
          </div>
          <Btn
            onClick={handleStep1}
            className="w-full justify-center h-11 text-[13px]"
          >
            Continue to Academic Info <ArrowRight size={14} />
          </Btn>
        </div>
      )}

      {/* STEP 2: ACADEMIC BATCH */}
      {regStep === 2 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                className="text-[11px] font-bold tracking-widest uppercase flex items-center gap-1.5 mb-2"
                style={{ color: t.t2 }}
              >
                <Hash size={12} /> University ID
              </label>
              <Inp
                value={formData.universityId}
                onChange={(e) =>
                  setFormData({ ...formData, universityId: e.target.value })
                }
                placeholder="CS20BTech1014"
                autoComplete="off"
              />
            </div>
            <div>
              <label
                className="text-[11px] font-bold tracking-widest uppercase flex items-center gap-1.5 mb-2"
                style={{ color: t.t2 }}
              >
                <Layers size={12} /> Course
              </label>
              <select
                value={formData.courseId}
                onChange={(e) => {
                  const newCourseId = e.target.value;
                  const matchingBatches = batches.filter(
                    (b) => b.courseId === newCourseId
                  );
                  setFormData((prev) => ({
                    ...prev,
                    courseId: newCourseId,
                    batchId: matchingBatches[0]?.id || prev.batchId || batches[0]?.id || "",
                  }));
                }}
                className="w-full h-11 rounded-xl border px-3 text-[12px] focus:outline-none"
                style={{
                  background: dark ? "#0a232d" : "#f0f8fb",
                  borderColor: dark ? "#1a4454" : "#c0dde8",
                  color: t.t1,
                }}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              className="text-[11px] font-bold tracking-widest uppercase flex items-center gap-1.5 mb-2"
              style={{ color: t.t2 }}
            >
              <Layers size={12} /> Enrolled Batch
            </label>
            <select
              value={formData.batchId}
              onChange={(e) =>
                setFormData({ ...formData, batchId: e.target.value })
              }
              className="w-full h-11 rounded-xl border px-3 text-[12px] focus:outline-none"
              style={{
                background: dark ? "#0a232d" : "#f0f8fb",
                borderColor: dark ? "#1a4454" : "#c0dde8",
                color: t.t1,
              }}
            >
              {batches
                .filter(
                  (b) => !formData.courseId || b.courseId === formData.courseId
                )
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label
              className="text-[11px] font-bold tracking-widest uppercase flex items-center gap-1.5 mb-2"
              style={{ color: t.t2 }}
            >
              <Phone size={12} /> Phone (10 digits)
            </label>
            <Inp
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              placeholder="9876543210"
              autoComplete="off"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Btn2 onClick={() => setRegStep(1)} className="flex-1 justify-center">
              Back
            </Btn2>
            <Btn
              disabled={loading}
              onClick={handleStep2}
              className="flex-1 justify-center"
            >
              {loading ? "Sending..." : "Send OTP"} <ArrowRight size={14} />
            </Btn>
          </div>
        </div>
      )}

      {/* STEP 3: OTP VERIFICATION */}
      {regStep === 3 && (
        <div className="space-y-3">
          <div
            className="rounded-xl p-3 text-center"
            style={{
              background: dark
                ? "rgba(34,211,238,0.08)"
                : "rgba(8,145,178,0.06)",
              border: "1px solid",
              borderColor: t.acc,
            }}
          >
            <div className="h-10 w-10 mx-auto rounded-full grid place-items-center bg-gradient-to-br from-[#06b6d4] to-[#2563eb] text-white shadow-[0_0_16px_rgba(6,182,214,0.3)]">
              <Mail size={16} />
            </div>
            <div
              className="mt-2 text-[13px] font-semibold"
              style={{ color: t.t1 }}
            >
              Verify your email
            </div>
            <div className="text-[11px]" style={{ color: t.t2 }}>
              We sent a 6-digit code to {formData.email}
            </div>
          </div>

          <div className="flex gap-2 justify-center">
            {otpDigits.map((d, i) => (
              <input
                key={i}
                value={d}
                onChange={(e) => {
                  const nd = [...otpDigits];
                  nd[i] = e.target.value.slice(-1);
                  setOtpDigits(nd);
                  if (e.target.value && i < 5)
                    document.getElementById(`otp-${i + 1}`)?.focus();
                }}
                id={`otp-${i}`}
                maxLength={1}
                className="h-12 w-11 rounded-xl border text-center text-[18px] font-bold focus:outline-none focus:ring-2"
                style={{
                  background: dark ? "#0a232d" : "#f0f8fb",
                  borderColor: dark ? "#1a4454" : "#c0dde8",
                  color: t.t1,
                  caretColor: t.acc,
                }}
              />
            ))}
          </div>

          <div className="text-center text-[11px]" style={{ color: t.t3 }}>
            Didn't receive?{" "}
            <button
              type="button"
              onClick={() => showToast("OTP resent to email")}
              className="hover:underline font-medium cursor-pointer"
              style={{ color: t.acc }}
            >
              Resend
            </button>
          </div>

          <div className="flex gap-2">
            <Btn2 onClick={() => setRegStep(2)} className="flex-1 justify-center">
              Back
            </Btn2>
            <Btn
              disabled={loading}
              onClick={handleVerifyOtp}
              className="flex-1 justify-center"
            >
              {loading ? "Verifying..." : "Verify & Enter"}{" "}
              <CheckCircle2 size={14} />
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterForm;
