// src/components/auth/AuthContainer.tsx
import React, { useState } from "react";
import Logo from "../landing/Logo";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import ResetPasswordForm from "./ResetPasswordForm";
import {
  GitBranch,
  Code2,
  CheckCircle2,
  Sun,
  Moon,
  LogIn,
  UserPlus,
  Shield,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import type { Course, Batch } from "../../types";

interface AuthContainerProps {
  initialMode?: "login" | "register" | "forgot" | "reset";
  onReturnToLanding: () => void;
  courses: Course[];
  batches: Batch[];
  onAuthComplete: () => void;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({
  initialMode = "login",
  onReturnToLanding,
  courses,
  batches,
  onAuthComplete,
}) => {
  const { dark, toggleDark, t } = useTheme();
  const { users } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot" | "reset">(
    initialMode
  );
  const [resetEmail, setResetEmail] = useState("");

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 py-8 sm:py-12 relative overflow-y-auto overscroll-contain touch-pan-y custom-scrollbar"
      style={{
        background: "linear-gradient(135deg, #e0f7ff 0%, #f0f4ff 35%, #faf0ff 65%, #e8f8f0 100%)",
        scrollbarGutter: "stable",
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); *{font-family:Inter,sans-serif}`}</style>

      {/* Animated aurora background - soft light glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-20%] left-[-5%] w-[65%] h-[65%] rounded-full bg-gradient-to-br from-[#67e8f9]/40 via-[#a5f3fc]/25 to-transparent blur-[120px] animate-pulse"
          style={{ animationDuration: "7s" }}
        />
        <div
          className="absolute bottom-[-20%] right-[-5%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-[#c7d2fe]/50 via-[#a5b4fc]/30 to-transparent blur-[120px] animate-pulse"
          style={{ animationDuration: "9s" }}
        />
        <div
          className="absolute top-[25%] left-[35%] w-[45%] h-[45%] rounded-full bg-gradient-to-r from-[#bbf7d0]/30 to-[#6ee7b7]/20 blur-[100px] animate-pulse"
          style={{ animationDuration: "11s" }}
        />
        <div
          className="absolute top-[60%] left-[10%] w-[35%] h-[35%] rounded-full bg-gradient-to-br from-[#fde68a]/25 to-[#fca5a5]/15 blur-[90px] animate-pulse"
          style={{ animationDuration: "13s" }}
        />
      </div>

      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(6,182,212,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.15) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div
        className="relative w-full max-w-[520px] xl:max-w-[1080px] grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] rounded-[28px] xl:rounded-[32px] overflow-hidden border border-white/60 shadow-[0_24px_60px_rgba(14,116,144,0.15),0_0_0_1px_rgba(255,255,255,0.7)] min-h-[580px]"
        style={{ backdropFilter: "blur(40px)" }}
      >
        {/* Left Brand Hero – hidden on mobile, shows on xl+ */}
        <div
          className="relative p-10 xl:p-12 hidden xl:flex flex-col justify-between overflow-hidden min-h-[580px] min-w-0"
          style={{
            background:
              "linear-gradient(160deg, #0a2a38 0%, #0e1f2c 40%, #091520 100%)",
          }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-[360px] h-[360px] rounded-full bg-gradient-to-br from-[#06b6d4]/40 to-[#2563eb]/25 blur-[2px]" />
            <div className="absolute bottom-[-80px] left-[-40px] w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-[#14b8a6]/25 to-[#06b6d4]/15 blur-[30px]" />
          </div>

          <div className="relative">
            <button
              onClick={onReturnToLanding}
              className="flex items-center gap-3 text-left cursor-pointer group"
            >
              <div className="group-hover:scale-105 transition flex-shrink-0 shadow-[0_0_30px_rgba(6,182,214,0.3)] rounded-2xl">
                <Logo size={42} />
              </div>
              <div>
                <span className="font-bold text-white text-[16px] tracking-tight block">
                  GiteaForge LMS
                </span>
                <span className="text-[11px] text-[#22d3ee] flex items-center gap-1">
                  ← Return to Landing Page
                </span>
              </div>
            </button>

            <h1 className="mt-12 text-[42px] lg:text-[48px] font-bold text-white leading-[0.95] tracking-[-0.03em]">
              Where Git
              <br />
              meets{" "}
              <span className="bg-gradient-to-r from-[#22d3ee] via-[#06b6d4] to-[#3b82f6] bg-clip-text text-transparent">
                campus
              </span>
            </h1>

            <p className="mt-5 text-[14px] leading-relaxed text-[#8ab8c6] max-w-[34ch]">
              Industry-grade Gitea repositories, automated Judge0 sandboxes, milestone tracking — all in one platform.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                { icon: <GitBranch size={13} />, label: "Real Git Repos" },
                { icon: <Code2 size={13} />, label: "Judge0 Sandbox" },
                { icon: <CheckCircle2 size={13} />, label: "Milestone Tracking" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-2 text-[12px] text-[#a0d0e0] px-3 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-xl"
                >
                  <span className="text-[#22d3ee]">{f.icon}</span>
                  {f.label}
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center gap-3 mt-8">
            <div className="flex -space-x-2">
              {users.slice(0, 4).map((u) => (
                <img
                  key={u.id}
                  src={u.avatar}
                  className="h-8 w-8 rounded-full border-2 border-[#0a2a38] object-cover"
                  alt=""
                />
              ))}
            </div>
            <div className="text-[12px] text-[#8ab8c6]">
              <b className="text-white">248+</b> students & faculty active
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div
          className="p-8 xl:p-12 flex flex-col justify-center overflow-y-auto overflow-x-hidden w-full min-w-0 min-h-[580px]"
          style={{
            background: dark
              ? "rgba(15,26,36,0.9)"
              : "rgba(248,252,253,0.95)",
            backdropFilter: "blur(20px)",
            scrollbarGutter: "stable",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onReturnToLanding}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold hover:underline cursor-pointer"
              style={{ color: t.acc }}
            >
              ← Back to Home
            </button>
            <button
              onClick={toggleDark}
              className="h-9 w-9 rounded-full border grid place-items-center transition-all hover:scale-105 flex-shrink-0 cursor-pointer"
              style={{
                borderColor: dark ? "#2e5065" : "#c0dde8",
                background: dark ? "#1c3044" : "#f0f8fb",
                color: dark ? "#22d3ee" : "#0891b2",
              }}
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>

          <div className="mb-6">
            <h2
              className="text-[26px] font-bold"
              style={{ color: dark ? "#f0f8fc" : "#0f2a33" }}
            >
              {authMode === "login"
                ? "Welcome back"
                : authMode === "register"
                ? "Create account"
                : authMode === "forgot"
                ? "Reset Password"
                : "New Password"}
            </h2>
            <p className="text-[13px] mt-1" style={{ color: t.t2 }}>
              {authMode === "login"
                ? "Sign in to your university portal"
                : authMode === "register"
                ? "Join GiteaForge LMS — free for students"
                : "Regain access to your academic account"}
            </p>
          </div>

          {/* Mode Switcher */}
          {(authMode === "login" || authMode === "register") && (
            <div
              className="flex gap-1 p-1 rounded-xl mb-6 border"
              style={{
                background: dark ? "#0e2d3a" : "#e6f4f8",
                borderColor: dark ? "#1a4454" : "#c0dde8",
              }}
            >
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setAuthMode(m)}
                  className={`flex-1 h-9 rounded-lg text-[12px] font-bold tracking-widest capitalize transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === m
                      ? dark
                        ? "bg-[#22d3ee] text-[#0f2a33] shadow-md"
                        : "bg-white text-[#0f2a33] shadow-md"
                      : ""
                  }`}
                  style={authMode !== m ? { color: t.t2 } : {}}
                >
                  {m === "login" ? <LogIn size={12} /> : <UserPlus size={12} />}
                  {m === "login" ? "Sign In" : "Register"}
                </button>
              ))}
            </div>
          )}

          {/* Form Switcher */}
          {authMode === "login" && (
            <LoginForm
              onForgotPassword={() => setAuthMode("forgot")}
              onSuccess={onAuthComplete}
            />
          )}

          {authMode === "register" && (
            <RegisterForm
              courses={courses}
              batches={batches}
              onSuccess={onAuthComplete}
            />
          )}

          {authMode === "forgot" && (
            <ForgotPasswordForm
              onBackToLogin={() => setAuthMode("login")}
              onCodeSent={(email) => {
                setResetEmail(email);
                setAuthMode("reset");
              }}
            />
          )}

          {authMode === "reset" && (
            <ResetPasswordForm
              email={resetEmail}
              onSuccess={() => setAuthMode("login")}
            />
          )}

          <div
            className="mt-6 pt-5 border-t flex items-center justify-between"
            style={{ borderColor: dark ? "#1c3044" : "#e0f0f5" }}
          >
            <div
              className="flex items-center gap-2 text-[11px]"
              style={{ color: t.t3 }}
            >
              <span className="h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e] animate-pulse" />{" "}
              Gitea Server Online • GCP VM
            </div>
            <div
              className="flex items-center gap-1 text-[11px]"
              style={{ color: t.t3 }}
            >
              <Shield size={11} /> JWT + OTP secured
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthContainer;
