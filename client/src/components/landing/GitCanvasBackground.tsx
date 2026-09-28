import { useEffect, useRef } from 'react';

interface GitNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  pulsePhase: number;
  branch: number;
}

export default function GitCanvasBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates for reactive interaction
    const mouse = { x: -1000, y: -1000, active: false };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
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

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    // Increase the number of nodes a little bit (from ~38 to ~65-75)
    const nodeCount = Math.min(75, Math.max(48, Math.floor((width * height) / 18000)));
    const colors = [
      'rgba(8, 145, 178, 0.55)',  // Deep Cyan
      'rgba(2, 132, 199, 0.5)',   // Ocean Azure
      'rgba(16, 185, 129, 0.45)', // Emerald Git Green
      'rgba(99, 102, 241, 0.45)', // Indigo
      'rgba(217, 119, 6, 0.4)',   // Amber
    ];

    const nodes: GitNode[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2.2 + 2,
        color: colors[i % colors.length],
        pulsePhase: Math.random() * Math.PI * 2,
        branch: i % 4,
      });
    }

    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Connect nodes with Git-style branch connectors
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];

        // Move nodes gently
        nodeA.x += nodeA.vx;
        nodeA.y += nodeA.vy;

        // Bounce from walls
        if (nodeA.x < 0 || nodeA.x > width) nodeA.vx *= -1;
        if (nodeA.y < 0 || nodeA.y > height) nodeA.vy *= -1;

        // Mouse gentle repulsion / pull
        if (mouse.active) {
          const dx = mouse.x - nodeA.x;
          const dy = mouse.y - nodeA.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180 && dist > 10) {
            const force = (180 - dist) / 180;
            nodeA.x -= (dx / dist) * force * 0.8;
            nodeA.y -= (dy / dist) * force * 0.8;
          }
        }

        // Draw connections
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 135) {
            const alpha = (1 - dist / 135) * 0.25;
            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);

            // Subtle curved branch representation
            const midX = (nodeA.x + nodeB.x) / 2;
            const midY = (nodeA.y + nodeB.y) / 2 + (nodeA.branch % 2 === 0 ? 10 : -10);
            ctx.quadraticCurveTo(midX, midY, nodeB.x, nodeB.y);

            ctx.strokeStyle = `rgba(8, 145, 178, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Draw Git commit dot
        nodeA.pulsePhase += 0.03;
        const currentRadius = nodeA.radius + Math.sin(nodeA.pulsePhase) * 0.8;

        ctx.beginPath();
        ctx.arc(nodeA.x, nodeA.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = nodeA.color;
        ctx.fill();

        // Outer glow ring
        ctx.beginPath();
        ctx.arc(nodeA.x, nodeA.y, currentRadius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(8, 145, 178, 0.2)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-75"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
}
