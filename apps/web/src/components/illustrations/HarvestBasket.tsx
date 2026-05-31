import type { SVGProps } from "react";

export function HarvestBasket({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* basket body */}
      <path d="M25 75 Q20 130 80 140 Q140 130 135 75 Z" strokeWidth="1.5" />
      {/* basket weave horizontal */}
      <path d="M28 90 Q80 84 132 90" strokeWidth="0.6" />
      <path d="M26 105 Q80 98 134 105" strokeWidth="0.6" />
      <path d="M25 120 Q80 113 135 120" strokeWidth="0.6" />
      {/* basket weave vertical */}
      <line x1="55" y1="75" x2="48" y2="135" strokeWidth="0.6" />
      <line x1="80" y1="75" x2="80" y2="140" strokeWidth="0.6" />
      <line x1="105" y1="75" x2="112" y2="135" strokeWidth="0.6" />
      {/* handle arc */}
      <path d="M45 75 Q80 30 115 75" strokeWidth="1.5" />
      {/* produce sticking out: apple */}
      <circle cx="65" cy="62" r="12" strokeWidth="1.2" />
      <path d="M65 50 Q68 45 72 47" strokeWidth="0.8" />
      {/* produce: round veg */}
      <circle cx="95" cy="66" r="9" strokeWidth="1.2" />
      <path d="M95 57 L95 52" strokeWidth="0.8" />
      {/* produce: leaf */}
      <path
        d="M110 60 C118 52 126 56 120 64 C126 56 122 48 114 52 C118 44 126 44 128 54"
        strokeWidth="0.8"
      />
    </svg>
  );
}
