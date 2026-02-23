import { useEffect, useRef } from "react";


export function ParticleCanvas({ streak }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const streakRef = useRef(streak);

  useEffect(() => { streakRef.current = streak; }, [streak]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    resize();

    const spawnParticles = (x, y, count, type = 'spark') => {
      let colors = type === 'fire' ? ['#ef4444', '#f87171', '#fbbf24', '#f59e0b'] : ['#f59e0b', '#fbbf24'];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vx = type === 'ember' ? (Math.random() - 0.5) * 2 : Math.cos(angle) * (Math.random() * 3 + 1);
        const vy = type === 'ember' ? -(Math.random() * 2 + 1) : Math.sin(angle) * (Math.random() * 3 + 1);
        particlesRef.current.push({
          x, y, vx, vy, life: 1.0, decay: Math.random() * 0.02 + 0.015,
          color: colors[Math.floor(Math.random() * colors.length)], size: Math.random() * 2.5 + 1, type
        });
      }
    };

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      if (streakRef.current >= 10 && Math.random() < 0.3) {
        particlesRef.current.push({
          x: Math.random() * canvas.width, y: canvas.height + 10,
          vx: (Math.random() - 0.5) * 1.5, vy: -(Math.random() * 4 + 2),
          life: 1.0, decay: 0.01, color: Math.random() > 0.5 ? '#fbbf24' : '#ef4444', size: Math.random() * 3 + 1, type: 'ember'
        });
        active = true;
      }

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        let p = particlesRef.current[i];
        p.x += p.vx; p.y += p.vy; p.life -= p.decay;
        if (p.type === 'ember') p.vx += (Math.random() - 0.5) * 0.1;

        if (p.life <= 0) particlesRef.current.splice(i, 1);
        else {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          active = true;
        }
      }
      if (active || streakRef.current >= 10) animationFrameId = requestAnimationFrame(loop);
      else animationFrameId = null;
    };

    const startLoop = () => { if (!animationFrameId) animationFrameId = requestAnimationFrame(loop); };

    const handleMouseDown = (e) => {
      if (streakRef.current >= 10) { spawnParticles(e.clientX, e.clientY, 8, 'fire'); startLoop(); }
    };
    window.addEventListener('mousedown', handleMouseDown);

    if (streakRef.current >= 10) startLoop();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousedown', handleMouseDown);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} id="particle-canvas" className="fixed inset-0 pointer-events-none z-[100]"></canvas>;
}