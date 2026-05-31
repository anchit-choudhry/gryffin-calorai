import type { SVGProps } from "react";

export function WheatSprig({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* main stem */}
      <line x1="24" y1="76" x2="24" y2="8" />
      {/* grain head — stacked ellipses */}
      <ellipse cx="24" cy="12" rx="4" ry="6" />
      <ellipse cx="24" cy="20" rx="4" ry="5.5" />
      <ellipse cx="24" cy="27.5" rx="3.5" ry="5" />
      {/* left spikelets */}
      <path d="M24 22 C16 18 12 12 14 8" />
      <path d="M24 30 C15 26 10 19 13 14" />
      <path d="M24 38 C16 34 12 27 14 22" />
      {/* right spikelets */}
      <path d="M24 22 C32 18 36 12 34 8" />
      <path d="M24 30 C33 26 38 19 35 14" />
      <path d="M24 38 C32 34 36 27 34 22" />
      {/* lower leaf pairs */}
      <path d="M24 52 C18 46 14 40 16 36" />
      <path d="M24 52 C30 46 34 40 32 36" />
      <path d="M24 64 C18 58 15 52 17 48" />
      <path d="M24 64 C30 58 33 52 31 48" />
    </svg>
  );
}
