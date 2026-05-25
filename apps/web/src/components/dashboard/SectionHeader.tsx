import type { FC } from "react";

interface Props {
  /** @deprecated kicker is no longer rendered; kept for API compatibility */
  kicker?: string;
  title: string;
  subtitle?: string;
  className?: string;
  accent?: boolean;
}

const SectionHeader: FC<Props> = ({ title, subtitle, className, accent }) => (
  <div className={`pb-3 ${accent ? "border-l-2 border-l-persimmon pl-4" : ""} ${className ?? ""}`}>
    <div className="flex items-baseline gap-3">
      <h2 className="font-sans font-semibold text-ink text-[clamp(1.125rem,1rem+0.6vw,1.5rem)]">
        {title}
      </h2>
      {subtitle && <span className="text-sm text-ink-soft ml-auto">{subtitle}</span>}
    </div>
  </div>
);

export default SectionHeader;
