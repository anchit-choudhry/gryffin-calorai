import type { SVGProps } from "react";

export function SunRay({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* center circle */}
      <circle cx="24" cy="24" r="7" />
      {/* cardinal rays */}
      <line x1="24" y1="4" x2="24" y2="13" />
      <line x1="24" y1="35" x2="24" y2="44" />
      <line x1="4" y1="24" x2="13" y2="24" />
      <line x1="35" y1="24" x2="44" y2="24" />
      {/* diagonal rays — shorter */}
      <line x1="10.1" y1="10.1" x2="16.5" y2="16.5" />
      <line x1="31.5" y1="31.5" x2="37.9" y2="37.9" />
      <line x1="37.9" y1="10.1" x2="31.5" y2="16.5" />
      <line x1="16.5" y1="31.5" x2="10.1" y2="37.9" />
    </svg>
  );
}
