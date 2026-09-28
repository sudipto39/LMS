import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  baseRadius: number;
  currentRadius: number;
  alpha: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
  isFourPoint: boolean;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

export default function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates for gentle reactive interaction
    const mouse = { x: -1000, y: -1000, active: false };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    // High density palette tailored for oceanic light & dark contrast
    const starColors = [
      "rgba(8, 145, 178, ",    // Vibrant Oceanic Cyan
      "rgba(2, 132, 199, ",    // Deep Sky Blue
      "rgba(14, 116, 144, ",   // Teal Slate
      "rgba(16, 185, 129, ",   // Git Emerald
      "rgba(217, 119, 6, ",    // Warm Golden Amber
      "rgba(99, 102, 241, ",   // Indigo Sparkle
      "rgba(255, 255, 255, ",  // Radiant Crisp White
    ];

    let stars: Star[] = [];
    const shootingStars: ShootingStar[] = [];

    const initStars = () => {
      // High density star count all over the screen
      const count = Math.max(160, Math.min(320, Math.floor((width * height) / 5500)));
      stars = [];

      for (let i = 0; i < count; i++) {
        const isFourPoint = i % 5 === 0; // 20% are distinct 4-point cross stars
        const baseRadius = isFourPoint ? Math.random() * 2.2 + 2.2 : Math.random() * 1.6 + 0.8;
        const color = starColors[Math.floor(Math.random() * starColors.length)];
        const baseAlpha = Math.random() * 0.4 + 0.35; // Clearly visible on #eaf4f7

        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          baseRadius,
          currentRadius: baseRadius,
          alpha: baseAlpha,
          baseAlpha,
          twinkleSpeed: Math.random() * 0.035 + 0.015,
          twinklePhase: Math.random() * Math.PI * 2,
          color,
          isFourPoint,
          vx: (Math.random() - 0.5) * 0.15, // Gentle cosmic drift
          vy: (Math.random() - 0.5) * 0.15,
          rotation: Math.random() * Math.PI,
          rotationSpeed: (Math.random() - 0.5) * 0.01,
        });
      }
    };

    initStars();

    // Helper to spawn a shooting star
    const maybeSpawnShootingStar = () => {
      if (shootingStars.length < 2 && Math.random() < 0.015) {
        const startX = Math.random() * width * 0.8 + width * 0.1;
        const startY = Math.random() * (height * 0.4);
        shootingStars.push({
          x: startX,
          y: startY,
          length: Math.random() * 80 + 60,
          speed: Math.random() * 5 + 6,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2, // ~45 degrees downward
          alpha: 1,
          life: 0,
          maxLife: Math.random() * 35 + 25,
          color: Math.random() > 0.4 ? "rgba(8, 145, 178, " : "rgba(245, 158, 11, ",
        });
      }
    };

    // Draw 4-point sparkling star
    const drawFourPointStar = (
      cx: number,
      cy: number,
      spikes: number,
      outerRadius: number,
      innerRadius: number,
      rotation: number
    ) => {
      let rot = (Math.PI / 2) * 3 + rotation;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
    };

    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Render regular stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        // Cosmic drift
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        // Twinkle calculation
        s.twinklePhase += s.twinkleSpeed;
        const twinkleFactor = Math.sin(s.twinklePhase);
        s.alpha = Math.max(0.15, Math.min(0.95, s.baseAlpha + twinkleFactor * 0.35));
        s.currentRadius = Math.max(0.6, s.baseRadius + twinkleFactor * 0.45);
        s.rotation += s.rotationSpeed;

        // Mouse proximity shimmer
        if (mouse.active) {
          const dx = mouse.x - s.x;
          const dy = mouse.y - s.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 22500) { // 150px
            const dist = Math.sqrt(distSq);
            const proximity = (150 - dist) / 150;
            s.alpha = Math.min(1, s.alpha + proximity * 0.45);
            s.currentRadius = s.baseRadius * (1 + proximity * 0.5);
          }
        }

        if (s.isFourPoint) {
          // Glow halo
          ctx.save();
          ctx.fillStyle = `${s.color}${s.alpha * 0.35})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.currentRadius * 2.2, 0, Math.PI * 2);
          ctx.fill();

          // 4-point star body
          ctx.fillStyle = `${s.color}${s.alpha})`;
          drawFourPointStar(s.x, s.y, 4, s.currentRadius * 2.5, s.currentRadius * 0.7, s.rotation);
          ctx.fill();
          ctx.restore();
        } else {
          // Standard circular micro-star with soft halo
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = `${s.color}${s.alpha})`;
          ctx.fill();

          if (s.currentRadius > 1.4) {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.currentRadius * 2.2, 0, Math.PI * 2);
            ctx.fillStyle = `${s.color}${s.alpha * 0.22})`;
            ctx.fill();
          }
        }
      }

      // Handle shooting stars
      maybeSpawnShootingStar();
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life++;
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;

        const lifeRatio = ss.life / ss.maxLife;
        const currentAlpha = (1 - lifeRatio) * ss.alpha;

        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;

        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, `${ss.color}0)`);
        grad.addColorStop(0.7, `${ss.color}${currentAlpha * 0.6})`);
        grad.addColorStop(1, `rgba(255, 255, 255, ${currentAlpha})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();

        // Bright head
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.fill();

        if (ss.life >= ss.maxLife || ss.x > width + 100 || ss.y > height + 100) {
          shootingStars.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
}
