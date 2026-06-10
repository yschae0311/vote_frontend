import { useEffect, useRef } from 'react';

const COLORS = [
  'oklch(0.75 0.18 85)',
  'oklch(0.65 0.2 25)',
  'oklch(0.7 0.16 150)',
  'oklch(0.68 0.18 300)',
  'oklch(0.72 0.14 220)',
  'oklch(0.8 0.15 60)',
];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  color: string;
  size: number;
  gravity: number;
};

type Props = {
  active: boolean;
  onDone?: () => void;
};

function spawnBurst(particles: Particle[], cx: number, cy: number) {
  const n = 60 + Math.floor(Math.random() * 40);
  for (let i = 0; i < n; i += 1) {
    const angle = (Math.PI * 2 * i) / n + Math.random() * 0.35;
    const speed = 3 + Math.random() * 7;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.012 + Math.random() * 0.018,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 2 + Math.random() * 3.5,
      gravity: 0.06 + Math.random() * 0.04,
    });
  }
}

export function ResultsFireworks({ active, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = [];
    const burstTimes = [0, 180, 360, 520, 720, 950, 1200];
    const fired = new Set<number>();
    const start = performance.now();
    let doneCalled = false;

    const frame = (now: number) => {
      const elapsed = now - start;
      const w = canvas.width;
      const h = canvas.height;

      for (const t of burstTimes) {
        if (elapsed >= t && !fired.has(t)) {
          fired.add(t);
          spawnBurst(
            particles,
            w * (0.22 + Math.random() * 0.56),
            h * (0.18 + Math.random() * 0.28),
          );
        }
      }

      ctx.clearRect(0, 0, w, h);

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.985;
        p.life -= p.decay;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (elapsed < 2600 || particles.length > 0) {
        rafRef.current = requestAnimationFrame(frame);
      } else if (!doneCalled) {
        doneCalled = true;
        onDone?.();
      }
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, onDone]);

  if (!active) return null;

  return <canvas ref={canvasRef} className="results-fireworks" aria-hidden />;
}
