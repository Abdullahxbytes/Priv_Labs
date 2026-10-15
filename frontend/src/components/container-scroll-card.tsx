"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function ContainerScrollCard({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const card = cardRef.current;
    if (!stage || !card) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      if (reducedMotion.matches) {
        card.style.removeProperty("transform");
        card.style.removeProperty("opacity");
        return;
      }

      const rect = stage.getBoundingClientRect();
      const start = window.innerHeight * 0.94;
      const end = window.innerHeight * 0.18;
      const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
      const eased = 1 - Math.pow(1 - progress, 3);
      const rotate = 14 * (1 - eased);
      const scale = 0.84 + 0.16 * eased;
      const translate = 72 * (1 - eased);

      card.style.transform = `perspective(1200px) translate3d(0, ${translate}px, 0) rotateX(${rotate}deg) scale(${scale})`;
      card.style.opacity = String(0.72 + 0.28 * eased);
    };

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    reducedMotion.addEventListener("change", requestUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      reducedMotion.removeEventListener("change", requestUpdate);
    };
  }, []);

  return (
    <div ref={stageRef} className="container-scroll-stage">
      <div ref={cardRef} className="container-scroll-card">
        {children}
      </div>
    </div>
  );
}
