import type { SVGProps } from "react";

export function WinterBranch({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-testid="winter-branch"
      className={className}
      {...props}
    >
      {/* main branch */}
      <line x1="10" y1="42" x2="32" y2="12" />
      {/* left offshoot */}
      <line x1="18" y1="32" x2="10" y2="22" />
      {/* right offshoot */}
      <line x1="24" y1="24" x2="36" y2="18" />
      {/* snowflake 1 - top right */}
      <line x1="38" y1="8" x2="38" y2="14" />
      <line x1="35" y1="9.5" x2="41" y2="12.5" />
      <line x1="35" y1="12.5" x2="41" y2="9.5" />
      {/* snowflake 2 - left */}
      <line x1="8" y1="16" x2="8" y2="22" />
      <line x1="5" y1="17.5" x2="11" y2="20.5" />
      <line x1="5" y1="20.5" x2="11" y2="17.5" />
      {/* snowflake 3 - small, right */}
      <line x1="42" y1="26" x2="42" y2="30" />
      <line x1="40" y1="27" x2="44" y2="29" />
      <line x1="40" y1="29" x2="44" y2="27" />
      {/* snowflake 4 - tiny, bottom left */}
      <line x1="4" y1="34" x2="4" y2="38" />
      <line x1="2" y1="35" x2="6" y2="37" />
      <line x1="2" y1="37" x2="6" y2="35" />
    </svg>
  );
}
