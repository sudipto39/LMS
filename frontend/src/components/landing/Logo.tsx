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
      <rect width="100" height="100" rx="22" fill="#0C1F38" />
      <rect
        width="98"
        height="98"
        x="1"
        y="1"
        rx="21"
        stroke="rgba(0, 163, 255, 0.2)"
        strokeWidth="1.5"
      />

      <g transform="translate(6, 6)">
        {/* Graduation Cap */}
        <path d="M44 8 L80 21 L44 34 L8 21 Z" fill="#00A3FF" />
        <path d="M22 26.5 L22 36 C22 42.5 66 42.5 66 36 L66 26.5 C56 31 32 31 22 26.5 Z" fill="#008BE3" />
        <path d="M44 21 L13 24.5 L12 40" stroke="#00A3FF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="41" r="2.2" fill="#00A3FF" />
        <path d="M9.8 43.2 L14.2 43.2 L13.5 48.5 L10.5 48.5 Z" fill="#00A3FF" />

        {/* Student Person */}
        <circle cx="25" cy="51" r="9" fill="#00A3FF" />
        <path d="M8 80 C8 64 42 64 42 80 Z" fill="#00A3FF" />

        {/* Shield with Git Branch */}
        <path d="M44 43.5 C57 40.5 76 37 83 48 C83 67 64 79 44 84.5 Z" fill="#00A3FF" />
        <circle cx="56.5" cy="53.5" r="3.2" fill="#0C1F38" />
        <circle cx="71.5" cy="56.5" r="3.2" fill="#0C1F38" />
        <circle cx="58.5" cy="74.5" r="2.8" fill="#0C1F38" />
        <path d="M56.5 56.7 L56.5 66 C56.5 70.5 58.5 71.7 58.5 71.7" stroke="#0C1F38" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M56.5 65 C56.5 61.5 71.5 62.5 71.5 59.7" stroke="#0C1F38" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
