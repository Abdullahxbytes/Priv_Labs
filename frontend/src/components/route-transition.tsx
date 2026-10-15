"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";

type TransitionState = "entering" | "idle" | "leaving";

export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<TransitionState>("entering");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let settleFrame = 0;
    const enterFrame = window.requestAnimationFrame(() => {
      setState("entering");
      settleFrame = window.requestAnimationFrame(() => setState("idle"));
    });
    return () => {
      window.cancelAnimationFrame(enterFrame);
      window.cancelAnimationFrame(settleFrame);
    };
  }, [pathname]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  function handleNavigation(event: MouseEvent<HTMLDivElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest("a[href]");
    if (!(anchor instanceof HTMLAnchorElement)) return;
    if (anchor.target || anchor.download || anchor.origin !== window.location.origin) return;

    const destination = new URL(anchor.href);
    const current = new URL(window.location.href);
    if (destination.pathname === current.pathname && destination.search === current.search) return;

    event.preventDefault();
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setState("leaving");
    timerRef.current = window.setTimeout(() => {
      router.push(`${destination.pathname}${destination.search}${destination.hash}`);
    }, 180);
  }

  return (
    <div className={`route-transition is-${state}`} onClickCapture={handleNavigation}>
      {children}
    </div>
  );
}
