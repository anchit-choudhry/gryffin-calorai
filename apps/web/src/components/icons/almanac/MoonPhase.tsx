import type { SVGProps } from "react";

interface MoonPhaseProps extends SVGProps<SVGSVGElement> {
  progress?: number;
}

function computeMoonShadow(progress: number): string {
  if (progress >= 0.98) return "";
  const r = 18;
  const rx = Math.round(r * Math.abs(Math.cos(progress * Math.PI)));
  const sweepFlag = progress <= 0.5 ? 1 : 0;
  return `M 24 6 A ${r} ${r} 0 0 0 24 42 A ${rx} ${r} 0 0 ${sweepFlag} 24 6 Z`;
}

export function MoonPhase({ className, progress, ...props }: MoonPhaseProps) {
  const shadowPath = progress !== undefined ? computeMoonShadow(progress) : null;

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
      <circle cx="24" cy="24" r="18" />
      {shadowPath !== null ? (
        shadowPath ? (
          <path d={shadowPath} fill="currentColor" stroke="none" />
        ) : null
      ) : (
        <path d="M24 6 C14 6 8 14 8 24 C8 34 14 42 24 42 C18 38 16 32 16 24 C16 16 18 10 24 6Z" />
      )}
      <circle cx="38" cy="10" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="42" cy="20" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="8" cy="8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
