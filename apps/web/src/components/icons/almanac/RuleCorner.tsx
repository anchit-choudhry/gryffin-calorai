import type { SVGProps } from "react";

export function RuleCorner({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* outer L-rule — heavier weight for the outer corner */}
      <polyline points="2,28 2,2 28,2" strokeWidth="1.5" />
      {/* inner parallel rule — hairline */}
      <polyline points="6,28 6,6 28,6" strokeWidth="0.5" />
      {/* small square at corner intersection */}
      <rect x="2" y="2" width="4" height="4" strokeWidth="0.5" />
    </svg>
  );
}
