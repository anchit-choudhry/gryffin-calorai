import type { SVGProps } from "react";

export function BodyScale({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* scale platform */}
      <rect x="20" y="50" width="120" height="55" rx="4" strokeWidth="1.5" />
      {/* scale base curve */}
      <path d="M25 105 Q80 115 135 105" strokeWidth="1" />
      {/* dial face */}
      <circle cx="80" cy="28" r="20" strokeWidth="1.5" />
      {/* dial tick marks */}
      {[0, 30, 60, 90, 120, 150, 180].map((angle) => {
        const rad = ((angle - 90) * Math.PI) / 180;
        const x1 = 80 + 16 * Math.cos(rad);
        const y1 = 28 + 16 * Math.sin(rad);
        const x2 = 80 + 19 * Math.cos(rad);
        const y2 = 28 + 19 * Math.sin(rad);
        return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="0.8" />;
      })}
      {/* needle pointing to mid-range */}
      <line x1="80" y1="28" x2="80" y2="12" strokeWidth="1.2" />
      <circle cx="80" cy="28" r="2" fill="currentColor" stroke="none" />
      {/* connector rod */}
      <line x1="80" y1="48" x2="80" y2="50" strokeWidth="1" />
      {/* display panel */}
      <rect x="55" y="62" width="50" height="24" rx="2" strokeWidth="0.75" />
      {/* dashed line in display — empty reading */}
      <line x1="65" y1="74" x2="95" y2="74" strokeDasharray="3 2" strokeWidth="0.8" />
    </svg>
  );
}
