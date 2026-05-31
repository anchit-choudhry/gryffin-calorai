import type { SVGProps } from "react";

export function EmptyPlate({ className, ...props }: SVGProps<SVGSVGElement>) {
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
      {/* plate rim */}
      <circle cx="80" cy="80" r="70" strokeWidth="1.5" />
      {/* inner plate well */}
      <circle cx="80" cy="80" r="54" strokeWidth="0.75" />
      {/* fork */}
      <line x1="50" y1="58" x2="50" y2="100" strokeWidth="1.2" />
      <line x1="46" y1="58" x2="46" y2="72" strokeWidth="1.2" />
      <line x1="50" y1="58" x2="50" y2="72" strokeWidth="1.2" />
      <line x1="54" y1="58" x2="54" y2="72" strokeWidth="1.2" />
      <path d="M46 72 Q50 78 54 72" strokeWidth="1.2" />
      {/* knife */}
      <line x1="110" y1="58" x2="110" y2="100" strokeWidth="1.2" />
      <path d="M110 58 Q115 65 110 78" strokeWidth="1.2" />
    </svg>
  );
}
