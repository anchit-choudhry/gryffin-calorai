import { useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 100;
const POLL_TIMEOUT_MS = 2000;
const SPOTLIGHT_PAD = 8;
const SCROLL_SETTLE_MS = 350;

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

function isInViewport(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.top >= 0 && r.bottom <= window.innerHeight;
}

export function useSpotlightRect(targetId: string | null, active: boolean): SpotlightRect {
  const [rect, setRect] = useState<SpotlightRect>(centeredFallback);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active || !targetId) {
      const id = requestAnimationFrame(() => setRect(centeredFallback()));
      return () => cancelAnimationFrame(id);
    }

    let cancelled = false;
    let hasScrolled = false;
    const startTime = Date.now();

    const measureEl = (el: Element) => {
      if (!cancelled) setRect(rectFromElement(el));
    };

    const measure = () => {
      const el = document.querySelector(`[data-tour-id="${targetId}"]`);
      if (el) {
        if (!hasScrolled && !isInViewport(el)) {
          hasScrolled = true;
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          // Re-measure after smooth scroll settles
          settleTimerRef.current = setTimeout(() => {
            const settled = document.querySelector(`[data-tour-id="${targetId}"]`);
            if (settled && !cancelled) measureEl(settled);
          }, SCROLL_SETTLE_MS);
        } else {
          hasScrolled = true;
        }
        measureEl(el);
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
      if (el && !cancelled) measureEl(el);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("scroll", handleResize, { passive: true });

    let ro: ResizeObserver | null = null;
    const el = document.querySelector(`[data-tour-id="${targetId}"]`);
    if (el) {
      ro = new ResizeObserver(() => {
        if (!cancelled) measureEl(el);
      });
      ro.observe(el);
    }

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      if (settleTimerRef.current !== null) clearTimeout(settleTimerRef.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize);
      ro?.disconnect();
    };
  }, [targetId, active]);

  return rect;
}
