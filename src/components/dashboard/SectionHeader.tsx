import type { FC } from "react";

interface Props {
  kicker: string;
  title: string;
  subtitle?: string;
  className?: string;
}

const SectionHeader: FC<Props> = ({ kicker, title, subtitle, className }) => (
  <div className={`pb-3 border-b border-rule ${className ?? ""}`}>
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-soft">
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
