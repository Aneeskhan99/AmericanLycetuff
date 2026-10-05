"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";

/*
 * Decorative lines from Figma Component 1 (Line 3 + Line 4), drawn on scroll (desktop only):
 *  - HorizontalScrollLine: 2px black rule across "A National School…" at y=91 (of 1920),
 *    grows left to right as that section scrolls in.
 *  - ScrollLineGroup: wraps "A National School…" + "Every Stage, under One Roof" and runs a
 *    2px vertical rule at x=155 (of 1920) through both. Nothing shows on first load; the line
 *    grows downward and follows the scroll, reaching the end of the second section.
 */

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function useScrollFrame(update: () => void) {
  useEffect(() => {
    let frame = 0;
    const run = () => {
      frame = 0;
      update();
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(run);
    };
    run();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [update]);
}

/** Horizontal rule inside the section it is placed in (the section must be `relative`). */
export function HorizontalScrollLine() {
  const line = useRef<HTMLSpanElement>(null);

  const update = useCallback(() => {
    const el = line.current;
    const section = el?.parentElement;
    if (!el || !section) return;
    if (reducedMotion()) {
      el.style.transform = "scaleX(1)";
      return;
    }
    const vh = window.innerHeight;
    const top = section.getBoundingClientRect().top;
    // 0 when the section top enters the screen, 1 once it has risen half the screen.
    el.style.transform = `scaleX(${clamp01((vh - top) / (vh * 0.5))})`;
  }, []);
  useScrollFrame(update);

  return (
    <span
      ref={line}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-[clamp(48px,4.765vw,91.5px)] z-10 hidden h-[2px] origin-left bg-black will-change-transform lg:block"
      style={{ transform: "scaleX(0)" }}
    />
  );
}

/** Wraps several sections and draws one vertical rule through all of them as you scroll. */
export function ScrollLineGroup({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLSpanElement>(null);

  const update = useCallback(() => {
    const wrap = root.current;
    const el = line.current;
    if (!wrap || !el) return;
    if (reducedMotion()) {
      el.style.transform = "scaleY(1)";
      return;
    }
    const rect = wrap.getBoundingClientRect();
    // The tip of the line follows a point 70% down the screen.
    const tip = window.innerHeight * 0.7 - rect.top;
    el.style.transform = `scaleY(${clamp01(tip / rect.height)})`;
  }, []);
  useScrollFrame(update);

  return (
    <div ref={root} className="relative">
      {children}
      <span
        ref={line}
        aria-hidden
        className="pointer-events-none absolute inset-y-0 z-10 hidden w-[2px] origin-top bg-black will-change-transform lg:block"
        // x=155 at 1920 = 56px left of the content column; stays clear of the text on smaller screens
        style={{ left: "max(16px, calc(max(6vw, (100vw - 1498px) / 2) - 56px))", transform: "scaleY(0)" }}
      />
    </div>
  );
}
