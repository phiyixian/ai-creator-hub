"use client";

import { useEffect, useRef } from "react";

export const CursorGlow = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let x = 0,
      y = 0,
      tx = 0,
      ty = 0;

    const speed = 0.18; // smoothing for the big glow

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      // snap the small dot instantly
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    };

    const raf = () => {
      // ease towards pointer for the glow
      tx += (x - tx) * speed;
      ty += (y - ty) * speed;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${tx - 150}px, ${ty - 150}px, 0)`;
      }
      frame = requestAnimationFrame(raf);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    let frame = requestAnimationFrame(raf);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {/* trailing glow */}
      <div
        ref={glowRef}
        className="absolute h-[300px] w-[300px] rounded-full opacity-40 blur-3xl mix-blend-screen hidden md:block"
        style={{
          background:
            "radial-gradient(600px circle at center, rgba(34,211,238,0.35), rgba(217,70,239,0.2) 40%, rgba(147,51,234,0.1) 70%, transparent)",
        }}
      />
      {/* crisp dot */}
      <div
        ref={dotRef}
        className="absolute -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_2px_rgba(34,211,238,0.8)]"
      />
    </div>
  );
};

export default CursorGlow;