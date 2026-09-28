export default function Logo({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
      aria-label="GiteaForge LMS Logo"
    >
      <defs>
        {/* Background gradient */}
        <linearGradient id="gf-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B1A2F" />
          <stop offset="100%" stopColor="#06101E" />
        </linearGradient>

        {/* Primary cyan/electric blue gradient */}
        <linearGradient id="gf-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        {/* Cap skull shaded gradient */}
        <linearGradient id="gf-cap-shade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>

        {/* Shield gradient */}
        <linearGradient id="gf-shield-facet" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="60%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
      </defs>

      {/* ── Background Squircle ───────────────────────────────────────── */}
      <rect width="100" height="100" rx="22" fill="url(#gf-bg)" />
      <rect
        width="98"
        height="98"
        x="1"
        y="1"
        rx="21"
        stroke="rgba(56, 189, 248, 0.28)"
        strokeWidth="1.5"
      />

      {/* ── 1. Graduation Cap (Harmoniously Encompassing Crown) ───────── */}
      {/* Cap Skull Under-Band */}
      <path
        d="M 23 27.5 L 23 35 C 23 40.5 77 40.5 77 35 L 77 27.5 C 64 31 36 31 23 27.5 Z"
        fill="url(#gf-cap-shade)"
      />
      {/* Mortarboard Diamond Top */}
      <path
        d="M 50 12 L 86 23.5 L 50 34.5 L 14 23.5 Z"
        fill="url(#gf-cyan)"
      />
      {/* Tassel */}
      <path
        d="M 50 23.5 C 33 24.5 17 27 16 40"
        stroke="#38BDF8"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="50" cy="23.5" r="2.2" fill="#38BDF8" />
      <circle cx="16" cy="41" r="2" fill="#38BDF8" />
      <path d="M 14.5 42.5 L 17.5 42.5 L 17 48 L 15 48 Z" fill="#38BDF8" />

      {/* ── 2. Scholar / Student Figure (Slightly Reduced Height, Balanced) ─ */}
      {/* Head */}
      <circle cx="31" cy="47" r="7.5" fill="url(#gf-cyan)" />
      {/* Body / Shoulders */}
      <path
        d="M 15 79 C 15 66.5 21 57.5 31 57.5 C 41 57.5 47 66.5 47 79 Z"
        fill="url(#gf-cyan)"
      />

      {/* ── 3. Heraldic Tech Shield (Proper Heater Geometry, Baseline y=79) ── */}
      <path
        d="M 51 45 Q 67 43 83 45 L 83 55 C 83 67.5 75 75.5 67 79 C 59 75.5 51 67.5 51 55 Z"
        fill="url(#gf-shield-facet)"
      />

      {/* Git Branch Icon Inside Shield (Centered & Scaled to Fit) */}
      <path
        d="M 63 51 L 63 69.5"
        stroke="#0B1A2F"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M 63 63 C 63 59 72 60.5 72 58"
        stroke="#0B1A2F"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="63" cy="49.5" r="3.2" fill="#0B1A2F" />
      <circle cx="72" cy="56.5" r="3.2" fill="#0B1A2F" />
      <circle cx="63" cy="71" r="3.2" fill="#0B1A2F" />

      {/* High-Tech Pinpoint Accents */}
      <circle cx="63" cy="49.5" r="1.3" fill="#38BDF8" />
      <circle cx="72" cy="56.5" r="1.3" fill="#38BDF8" />
      <circle cx="63" cy="71" r="1.3" fill="#38BDF8" />
    </svg>
  );
}
