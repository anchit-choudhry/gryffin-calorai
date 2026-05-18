import { useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 100;
const POLL_TIMEOUT_MS = 2000;
const SPOTLIGHT_PAD = 8;

export interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
  found: boolean;
}

function rectFromElement(el: Element): SpotlightRect {
  const r = el.getBoundingClientRect();
  return {
    top: r.top - SPOTLIGHT_PAD,
    left: r.left - SPOTLIGHT_PAD,
    width: r.width + SPOTLIGHT_PAD * 2,
    height: r.height + SPOTLIGHT_PAD * 2,
    found: true,
  };
}

const centeredFallback = (): SpotlightRect => ({
  top: window.innerHeight / 2 - 60,
  left: window.innerWidth / 2 - 120,
  width: 240,
  height: 120,
  found: false,
});

export function useSpotlightRect(targetId: string | null, active: boolean): SpotlightRect {
  const [rect, setRect] = useState<SpotlightRect>(centeredFallback);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active || !targetId) {
      const id = requestAnimationFrame(() => setRect(centeredFallback()));
      return () => cancelAnimationFrame(id);
    }

    let cancelled = false;
    const startTime = Date.now();

    const measure = () => {
      const el = document.querySelector(`[data-tour-id="${targetId}"]`);
      if (el) {
        if (!cancelled) setRect(rectFromElement(el));
        return true;
      }
      return false;
    };

    const poll = () => {
      if (cancelled) return;
      if (measure()) return;
      if (Date.now() - startTime >= POLL_TIMEOUT_MS) {
        if (!cancelled) setRect(centeredFallback());
        return;
      }
      timerRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(poll);
      }, POLL_INTERVAL_MS);
    };

    rafRef.current = requestAnimationFrame(poll);

    const handleResize = () => {
      const el = document.querySelector(`[data-tour-id="${targetId}"]`);
      if (el && !cancelled) setRect(rectFromElement(el));
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("scroll", handleResize, { passive: true });

    let ro: ResizeObserver | null = null;
    const el = document.querySelector(`[data-tour-id="${targetId}"]`);
    if (el) {
      ro = new ResizeObserver(() => {
        if (!cancelled) setRect(rectFromElement(el));
      });
      ro.observe(el);
    }

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize);
      ro?.disconnect();
    };
  }, [targetId, active]);

  return rect;
}
