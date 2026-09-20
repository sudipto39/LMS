// src/components/common/FillingBeakerLoader.tsx
import React from "react";

interface FillingBeakerLoaderProps {
  size?: number;
  className?: string;
  color?: string;
}

export const FillingBeakerLoader: React.FC<FillingBeakerLoaderProps> = ({
  size = 48,
  className = "",
  color = "#06b6d4",
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          {/* Gradient for Liquid Fill */}
          <linearGradient id="beaker-liquid-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="60%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>

          {/* Glow Filter for Bubbles & Liquid */}
          <filter id="beaker-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Conical Flask Inner Mask */}
          <clipPath id="flask-clip">
            <path d="M10 2.5 H14 V6.5 L19.2 18.8 C19.9 20.4 18.7 22 17 22 H7 C5.3 22 4.1 20.4 4.8 18.8 L10 6.5 Z" />
          </clipPath>
        </defs>

        <style>{`
          @keyframes fill-liquid {
            0% {
              transform: translateY(18px);
            }
            45% {
              transform: translateY(6px);
            }
            55% {
              transform: translateY(4px);
            }
            90% {
              transform: translateY(1px);
            }
            100% {
              transform: translateY(18px);
            }
          }

          @keyframes wave-slosh {
            0% {
              transform: translateX(0) scaleY(1);
            }
            50% {
              transform: translateX(-12px) scaleY(1.15);
            }
            100% {
              transform: translateX(0) scaleY(1);
            }
          }

          @keyframes bubble-rise-1 {
            0% {
              opacity: 0;
              transform: translateY(18px) scale(0.4);
            }
            30% {
              opacity: 0.9;
            }
            80% {
              opacity: 0.8;
              transform: translateY(6px) scale(1);
            }
            100% {
              opacity: 0;
              transform: translateY(2px) scale(1.3);
            }
          }

          @keyframes bubble-rise-2 {
            0% {
              opacity: 0;
              transform: translateY(19px) scale(0.3);
            }
            40% {
              opacity: 0.9;
            }
            85% {
              opacity: 0.7;
              transform: translateY(8px) scale(1.1);
            }
            100% {
              opacity: 0;
              transform: translateY(4px) scale(1.4);
            }
          }

          @keyframes bubble-rise-3 {
            0% {
              opacity: 0;
              transform: translateY(17px) scale(0.5);
            }
            50% {
              opacity: 0.85;
            }
            90% {
              opacity: 0.6;
              transform: translateY(7px) scale(0.9);
            }
            100% {
              opacity: 0;
              transform: translateY(3px) scale(1.2);
            }
          }

          @keyframes glass-pulse {
            0%, 100% {
              filter: drop-shadow(0 0 4px rgba(6, 182, 212, 0.25));
            }
            50% {
              filter: drop-shadow(0 0 10px rgba(6, 182, 212, 0.6));
            }
          }

          .beaker-glass {
            animation: glass-pulse 2.8s ease-in-out infinite;
          }

          .beaker-liquid-group {
            animation: fill-liquid 3.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          }

          .beaker-wave {
            animation: wave-slosh 1.6s ease-in-out infinite;
          }

          .beaker-bubble-1 {
            animation: bubble-rise-1 2.2s ease-in infinite;
            animation-delay: 0.3s;
          }

          .beaker-bubble-2 {
            animation: bubble-rise-2 2.6s ease-in infinite;
            animation-delay: 1.1s;
          }

          .beaker-bubble-3 {
            animation: bubble-rise-3 2s ease-in infinite;
            animation-delay: 1.7s;
          }
        `}</style>

        {/* ── Animated Liquid (Clipped Inside Flask) ── */}
        <g clipPath="url(#flask-clip)" className="beaker-glass">
          {/* Liquid Reservoir */}
          <g className="beaker-liquid-group">
            {/* Liquid Body */}
            <rect
              x="0"
              y="6"
              width="24"
              height="20"
              fill="url(#beaker-liquid-grad)"
              opacity="0.85"
            />

            {/* Wavy Surface */}
            <path
              d="M-12 6 Q -6 3, 0 6 T 12 6 T 24 6 T 36 6 V 12 H -12 Z"
              fill="url(#beaker-liquid-grad)"
              className="beaker-wave"
            />

            {/* Liquid Surface Highlight Line */}
            <path
              d="M-12 6 Q -6 3, 0 6 T 12 6 T 24 6 T 36 6"
              stroke="#ffffff"
              strokeWidth="0.75"
              strokeOpacity="0.75"
              fill="none"
              className="beaker-wave"
            />
          </g>

          {/* Effervescing Bubbles inside liquid */}
          <circle cx="10" cy="0" r="0.9" fill="#ffffff" filter="url(#beaker-glow)" className="beaker-bubble-1" />
          <circle cx="14" cy="0" r="1.1" fill="#a5f3fc" filter="url(#beaker-glow)" className="beaker-bubble-2" />
          <circle cx="12" cy="0" r="0.8" fill="#e0e7ff" filter="url(#beaker-glow)" className="beaker-bubble-3" />
        </g>

        {/* ── Outer Glass Outline (Lucide FlaskConical Accurate Silhouette) ── */}
        <g className="beaker-glass">
          {/* Flask Rim / Neck / Body Outline */}
          <path
            d="M10 2 H14 M10 2 V6 L4.5 19 C3.7 20.8 5 22 7 22 H17 C19 22 20.3 20.8 19.5 19 L14 6 V2"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Side Graduated Measurement Tick Marks */}
          <line x1="7.8" y1="17" x2="9.8" y2="17" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8" />
          <line x1="9.2" y1="13.5" x2="11.5" y2="13.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8" />
          <line x1="10.8" y1="10" x2="12.5" y2="10" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8" />

          {/* Glass Reflection Highlight */}
          <path
            d="M6.2 19 L10.5 7.5"
            stroke="#ffffff"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeOpacity="0.35"
          />
        </g>
      </svg>
    </div>
  );
};

export default FillingBeakerLoader;
