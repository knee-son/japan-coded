import { useState, useEffect, useCallback, useRef } from "react";

const CONFETTI_COLORS = ["#f7c948","#6dbf67","#5aa9e6","#e86b6b","#c47fe8","#f4a261"];

export default function Confetti({active, colors}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const particles = useRef([]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Spawn particles from centre-top area
    particles.current = Array.from({ length: 140 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.35,
      vx: (Math.random() - 0.5) * 8,
      vy: -(Math.random() * 6 + 3),
      w: Math.random() * 8 + 4,
      h: Math.random() * 4 + 3,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
      life: 1,
      decay: Math.random() * 0.012 + 0.008,
    }));

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18; // gravity
        p.vx *= 0.99;
        p.angle += p.spin;
        p.life -= p.decay;
        if (p.life <= 0) continue;
        alive = true;
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) rafRef.current = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", inset: 0,
        pointerEvents: "none", zIndex: 9999,
        width: "100%", height: "100%",
      }}
    />
  );
}
