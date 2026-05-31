import type { FC, ReactNode } from "react";
import { RuleCorner } from "@/components/icons/almanac";

interface Props {
  label: string;
  children: ReactNode;
  ornament?: boolean;
}

const EditorialFrame: FC<Props> = ({ label, children, ornament = false }) => (
  <div className="border border-rule relative">
    {ornament && (
      <RuleCorner
        className="absolute top-0 left-0 size-5 text-rule pointer-events-none"
        aria-hidden="true"
      />
    )}
    <div className="px-5 pt-3 pb-2 border-b border-rule">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
        {label}
      </span>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export default EditorialFrame;
