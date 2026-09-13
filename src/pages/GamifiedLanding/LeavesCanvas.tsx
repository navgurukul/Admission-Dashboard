import React, { useEffect, useRef } from 'react';

const LeavesCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const leaves: any[] = [];
    const leafColors = ['#10b981', '#059669', '#34d399', '#f59e0b', '#d97706'];

    for (let i = 0; i < 30; i++) {
      leaves.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 8 + Math.random() * 10,
        speedY: 0.6 + Math.random() * 1.2,
        speedX: (Math.random() - 0.5) * 0.8,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.04,
        color: leafColors[Math.floor(Math.random() * leafColors.length)],
        opacity: 0.4 + Math.random() * 0.4
      });
    }

    const animateLeaves = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      leaves.forEach(l => {
        l.y += l.speedY;
        l.x += l.speedX + Math.sin(l.y * 0.01) * 0.5;
        l.angle += l.spin;

        if (l.y > canvas.height + 20) {
          l.y = -20;
          l.x = Math.random() * canvas.width;
        }
        if (l.x > canvas.width + 20) l.x = -20;
        if (l.x < -20) l.x = canvas.width + 20;

        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.angle);
        ctx.globalAlpha = l.opacity;
        ctx.fillStyle = l.color;

        // Leaf SVG Shape
        ctx.beginPath();
        ctx.moveTo(0, -l.size);
        ctx.quadraticCurveTo(l.size * 0.7, 0, 0, l.size);
        ctx.quadraticCurveTo(-l.size * 0.7, 0, 0, -l.size);
        ctx.fill();

        // Central Vein
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -l.size * 0.8);
        ctx.lineTo(0, l.size * 0.8);
        ctx.stroke();

        ctx.restore();
      });
      animationFrameId = requestAnimationFrame(animateLeaves);
    };
    
    animateLeaves();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="leafCanvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
};

export default LeavesCanvas;
