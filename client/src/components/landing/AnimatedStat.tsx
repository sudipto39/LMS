import { useState, useEffect, useRef } from 'react';

interface AnimatedStatProps {
  value: string;
  label: string;
  color: string;
  icon: string;
}

export default function AnimatedStat({ value, label, color, icon }: AnimatedStatProps) {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const hasAnimated = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animateCount();
        }
      },
      { threshold: 0.25 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [value]);

  const animateCount = () => {
    // Parse numeric part and suffix
    const match = value.match(/^([\d.]+)(.*)$/);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const targetNum = parseFloat(match[1]);
    const suffix = match[2] || '';
    const isDecimal = match[1].includes('.');
    const duration = 1600; // ms
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease-out cubic curve
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = targetNum * easeOut;

      if (isDecimal) {
        setDisplayValue(`${current.toFixed(1)}${suffix}`);
      } else {
        setDisplayValue(`${Math.floor(current).toLocaleString()}${suffix}`);
      }

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(updateCounter);
  };

  return (
    <div
      ref={containerRef}
      className="stat-card group hover:-translate-y-1.5 transition-all duration-300"
      style={{ '--stat-color': color } as any}
    >
      <div className="stat-card__icon text-2xl mb-1 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div className="stat-card__value text-3xl sm:text-4xl font-extrabold text-[#0f2a33] font-mono tracking-tight">
        {displayValue}
      </div>
      <div className="stat-card__label text-xs sm:text-sm font-semibold text-[#4a7280]">
        {label}
      </div>
    </div>
  );
}
