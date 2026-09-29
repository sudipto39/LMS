// src/components/common/UIPrimitives.tsx
import React from "react";

export const Card = ({
  children,
  className = "",
  onClick,
  style,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  id?: string;
}) => (
  <div
    id={id}
    className={`rounded-2xl border transition-snappy lum-border ${className}`}
    style={{
      background: "var(--srf)",
      borderColor: "var(--bdr)",
      boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
      ...style,
    }}
    onClick={onClick}
  >
    {children}
  </div>
);

export const Card2 = ({
  children,
  className = "",
  onClick,
  style,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  id?: string;
}) => (
  <div
    id={id}
    className={`rounded-xl border transition-snappy lum-border ${className}`}
    style={{
      background: "var(--srf2)",
      borderColor: "var(--bdr)",
      boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.04)",
      ...style,
    }}
    onClick={onClick}
  >
    {children}
  </div>
);

export const Inp = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full h-11 rounded-xl px-4 text-[13px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-[var(--acc)] border transition-snappy lum-border ${
      props.className || ""
    }`}
    style={{
      background: "var(--srf2)",
      borderColor: "var(--bdr)",
      color: "var(--t1)",
      ...props.style,
    }}
  />
);

export const Btn = ({
  children,
  onClick,
  className = "",
  disabled = false,
  type = "button",
  style,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  style?: React.CSSProperties;
  title?: string;
}) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    style={style}
    title={title}
    className={`h-10 px-5 rounded-full bg-gradient-to-r from-[#06b6d4] to-[#2563eb] text-white font-semibold text-[13px] shadow-[0_4px_16px_rgba(6,182,214,0.28)] hover:shadow-[0_6px_24px_rgba(6,182,214,0.42)] active:scale-[0.98] transition-snappy cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

export const Btn2 = ({
  children,
  onClick,
  className = "",
  type = "button",
  style,
  disabled = false,
  title,
}: {
  children: React.ReactNode;
  onClick?: (() => void) | (() => Promise<void>);
  className?: string;
  type?: "button" | "submit" | "reset";
  style?: React.CSSProperties;
  disabled?: boolean;
  title?: string;
}) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    title={title}
    className={`h-9 px-4 rounded-full border text-[12px] font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-snappy hover:border-[var(--acc)] active:scale-[0.98] lum-border whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    style={{
      background: "var(--srf2)",
      borderColor: "var(--bdr)",
      color: "var(--t1)",
      ...style,
    }}
  >
    {children}
  </button>
);

export const Pill = ({
  children,
  color,
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) => (
  <span
    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border inline-flex items-center gap-1 transition-snappy ${className}`}
    style={{
      background: color ? `${color}15` : "var(--srf2)",
      borderColor: color ? `${color}35` : "var(--bdr)",
      color: color || "var(--t2)",
      boxShadow: color ? `0 0 10px -3px ${color}20` : undefined,
    }}
  >
    {children}
  </span>
);

export const PasswordStrengthMeter = ({
  password,
}: {
  password: string;
}) => {
  if (!password) return null;
  const suggestions: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else suggestions.push("Use at least 8 characters");

  if (password.length >= 12) score++;
  else if (password.length >= 8)
    suggestions.push("Use 12+ characters for better security");

  if (/[a-z]/.test(password)) score += 0.5;
  else suggestions.push("Add lowercase letters");

  if (/[A-Z]/.test(password)) score += 0.5;
  else suggestions.push("Add uppercase letters");

  if (/[0-9]/.test(password)) score += 0.5;
  else suggestions.push("Add numbers");

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 0.5;
  else suggestions.push("Add special characters (!@#$%^&*)");

  const commonPatterns = [
    /^123/,
    /^password/i,
    /^qwerty/i,
    /^admin/i,
    /^welcome/i,
    /^abc123/i,
    /^111/,
    /^12345/,
  ];

  if (commonPatterns.some((p) => p.test(password))) {
    score = Math.max(0, score - 2);
    suggestions.push("Avoid common password sequences");
  }

  const finalScore = Math.min(5, Math.round(score));
  const labels = [
    "Very Weak",
    "Weak",
    "Fair",
    "Strong",
    "Very Strong",
  ];
  const colors = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#06b6d4",
    "#22c55e",
  ];
  const idx = Math.min(4, Math.max(0, finalScore === 0 ? 0 : finalScore - 1));
  const activeColor = colors[idx];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-[10px] uppercase tracking-wider" style={{ color: "var(--t3)" }}>
          Password Strength:{" "}
          <span className="font-bold" style={{ color: activeColor }}>
            {finalScore === 0 ? "Very Weak" : labels[idx]}
          </span>
        </span>
        <span className="text-[10px]" style={{ color: "var(--t3)" }}>
          {finalScore}/5
        </span>
      </div>
      <div className="flex gap-1.5 h-1.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className="flex-1 rounded-full transition-all duration-300"
            style={{
              background:
                level <= finalScore ? activeColor : "var(--bdr)",
            }}
          />
        ))}
      </div>
      {suggestions.length > 0 && (
        <div className="text-[10px] text-[#f97316] flex items-center gap-1">
          <span>•</span> {suggestions[0]}
        </div>
      )}
    </div>
  );
};

