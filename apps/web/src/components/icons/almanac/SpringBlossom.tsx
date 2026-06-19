import type { SVGProps } from "react";

export function SpringBlossom({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-testid="spring-blossom"
      className={className}
      {...props}
    >
      {/* main branch */}
      <path d="M8 42 C16 32 26 24 38 12" />
      {/* secondary branch */}
      <path d="M22 28 C18 22 16 18 18 12" />
      {/* blossoms - open circles */}
      <circle cx="38" cy="12" r="3.5" />
      <circle cx="30" cy="18" r="3" />
      <circle cx="18" cy="12" r="3" />
      {/* stamen dots */}
      <circle cx="38" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="30" cy="18" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}
