import type { FC } from "react";

interface Props {
  kicker: string;
  title: string;
  subtitle?: string;
  className?: string;
  accent?: boolean;
}

const SectionHeader: FC<Props> = ({ kicker, title, subtitle, className, accent }) => (
  <div
    className={`pb-3 border-b border-rule ${accent ? "border-l-2 border-l-persimmon pl-4" : ""} ${className ?? ""}`}
  >
    <div className="flex items-baseline gap-4">
      <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink-soft opacity-50">
        {kicker}
      </span>
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      {subtitle && (
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft ml-auto">
          {subtitle}
        </span>
      )}
    </div>
  </div>
);

export default SectionHeader;
