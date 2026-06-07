import type { SVGProps } from "react";

interface RuleTicksProps extends SVGProps<SVGSVGElement> {
  /**
   * Number of tick marks to render.
   * Defaults to 5. Between 3 and 12 works well for section dividers.
   */
  ticks?: number;
  /**
   * Spacing between ticks in SVG units.
   * Defaults to 8 (yields a tight scholarly look).
   */
  spacing?: number;
}

/**
 * Horizontal row of evenly-spaced hairline tick marks.
 *
 * Used as a typographic ornament between section kicker and body text,
 * and as a decorative separator inside card footers. Pairs with
 * `SeasonalFlourish` for more prominent dividers.
 *
 * Rendered as `aria-hidden` — purely decorative.
 */
export function RuleTicks({ ticks = 5, spacing = 8, className, ...props }: RuleTicksProps) {
  const totalWidth = (ticks - 1) * spacing + 2;
  const height = 12;
  const midY = height / 2;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${height}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="0.75"
      strokeLinecap="square"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {Array.from({ length: ticks }, (_, i) => {
        const x = i * spacing + 1;
        /* Alternate between full-height and half-height ticks for
           a traditional typographic scale — long, short, long ... */
        const isShort = i % 2 === 1;
        const y1 = isShort ? midY - 2 : midY - 4;
        const y2 = isShort ? midY + 2 : midY + 4;
        return <line key={i} x1={x} y1={y1} x2={x} y2={y2} />;
      })}
    </svg>
  );
}
