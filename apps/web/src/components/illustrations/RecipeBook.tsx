import type { SVGProps } from "react";

export function RecipeBook({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 140 160"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* book body */}
      <path
        d="M20 20 Q16 20 16 24 L16 136 Q16 140 20 140 L110 140 Q114 140 114 136 L114 24 Q114 20 110 20 Z"
        strokeWidth="1.5"
      />
      {/* spine */}
      <line x1="35" y1="20" x2="35" y2="140" strokeWidth="2" />
      {/* pages edge */}
      <line x1="114" y1="24" x2="118" y2="28" strokeWidth="1" />
      <line x1="114" y1="136" x2="118" y2="132" strokeWidth="1" />
      <path d="M118 28 L118 132" strokeWidth="0.75" />
      {/* ruled lines on page */}
      <line x1="48" y1="50" x2="100" y2="50" strokeWidth="0.6" />
      <line x1="48" y1="62" x2="100" y2="62" strokeWidth="0.6" />
      <line x1="48" y1="74" x2="100" y2="74" strokeWidth="0.6" />
      <line x1="48" y1="86" x2="85" y2="86" strokeWidth="0.6" />
      {/* title block */}
      <rect x="48" y="34" width="52" height="8" rx="1" strokeWidth="0.6" />
      {/* small wheat sprig deco */}
      <path d="M56 106 L56 118" strokeWidth="0.8" />
      <path d="M56 108 C52 106 50 103 52 101" strokeWidth="0.8" />
      <path d="M56 108 C60 106 62 103 60 101" strokeWidth="0.8" />
      <path d="M56 112 C52 110 50 107 52 105" strokeWidth="0.8" />
      <path d="M56 112 C60 110 62 107 60 105" strokeWidth="0.8" />
    </svg>
  );
}
