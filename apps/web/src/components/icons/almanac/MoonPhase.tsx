import type { SVGProps } from "react";

export function MoonPhase({ className, ...props }: SVGProps<SVGSVGElement>) {
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
      {/* waxing gibbous — outer circle + inner crescent shadow */}
      <circle cx="24" cy="24" r="18" />
      {/* shadow arc suggesting lunar phase */}
      <path d="M24 6 C14 6 8 14 8 24 C8 34 14 42 24 42 C18 38 16 32 16 24 C16 16 18 10 24 6Z" />
      {/* small star dots */}
      <circle cx="38" cy="10" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="42" cy="20" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="8" cy="8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
