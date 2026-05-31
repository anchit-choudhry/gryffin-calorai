import type { SVGProps } from "react";

export function SeasonalFlourish({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 120 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* center rule line with decorative breaks */}
      <line x1="0" y1="12" x2="38" y2="12" />
      <line x1="82" y1="12" x2="120" y2="12" />
      {/* center diamond */}
      <polygon points="60,6 66,12 60,18 54,12" strokeWidth="1" />
      {/* left laurel sprigs */}
      <path d="M42 12 C42 6 46 4 49 6" />
      <path d="M42 12 C42 18 46 20 49 18" />
      <path d="M49 12 C49 6 53 4 56 7" />
      <path d="M49 12 C49 18 53 20 56 17" />
      {/* right laurel sprigs (mirrored) */}
      <path d="M78 12 C78 6 74 4 71 6" />
      <path d="M78 12 C78 18 74 20 71 18" />
      <path d="M71 12 C71 6 67 4 64 7" />
      <path d="M71 12 C71 18 67 20 64 17" />
      {/* small dot accents */}
      <circle cx="40" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="80" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
