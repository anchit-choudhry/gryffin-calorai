import type { SVGProps } from "react";

export function Footsteps({ className, ...props }: SVGProps<SVGSVGElement>) {
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
      {/* right foot — top */}
      <path d="M70 20 Q80 16 85 22 Q88 30 82 36 Q76 40 70 36 Q64 30 70 20Z" strokeWidth="1.2" />
      <line x1="78" y1="16" x2="79" y2="12" strokeWidth="0.8" />
      <line x1="82" y1="18" x2="84" y2="14" strokeWidth="0.8" />
      <line x1="85" y1="22" x2="88" y2="19" strokeWidth="0.8" />
      {/* left foot — second */}
      <path d="M35 52 Q25 48 20 54 Q17 62 23 68 Q29 72 35 68 Q41 62 35 52Z" strokeWidth="1.2" />
      <line x1="27" y1="48" x2="26" y2="44" strokeWidth="0.8" />
      <line x1="23" y1="50" x2="21" y2="46" strokeWidth="0.8" />
      <line x1="20" y1="54" x2="17" y2="51" strokeWidth="0.8" />
      {/* right foot — third */}
      <path d="M72 86 Q82 82 87 88 Q90 96 84 102 Q78 106 72 102 Q66 96 72 86Z" strokeWidth="1.2" />
      <line x1="80" y1="82" x2="81" y2="78" strokeWidth="0.8" />
      <line x1="84" y1="84" x2="86" y2="80" strokeWidth="0.8" />
      <line x1="87" y1="88" x2="90" y2="85" strokeWidth="0.8" />
      {/* left foot — fourth */}
      <path
        d="M33 118 Q23 114 18 120 Q15 128 21 134 Q27 138 33 134 Q39 128 33 118Z"
        strokeWidth="1.2"
      />
      <line x1="25" y1="114" x2="24" y2="110" strokeWidth="0.8" />
      <line x1="21" y1="116" x2="19" y2="112" strokeWidth="0.8" />
    </svg>
  );
}
