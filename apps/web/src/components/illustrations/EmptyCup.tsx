import type { SVGProps } from "react";

export function EmptyCup({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 120 160"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* glass body — tapered */}
      <path d="M28 30 L20 130 Q60 140 100 130 L92 30 Z" strokeWidth="1.5" />
      {/* rim highlight */}
      <line x1="28" y1="30" x2="92" y2="30" strokeWidth="1.5" />
      {/* water line suggestion — empty, faint */}
      <path d="M23 118 Q60 122 97 118" strokeWidth="0.5" opacity="0.4" />
      {/* condensation drops */}
      <line x1="18" y1="70" x2="18" y2="80" strokeWidth="0.8" />
      <line x1="14" y1="80" x2="14" y2="88" strokeWidth="0.8" />
      <line x1="104" y1="65" x2="104" y2="74" strokeWidth="0.8" />
      {/* straw */}
      <line x1="75" y1="10" x2="68" y2="130" strokeWidth="1" />
    </svg>
  );
}
