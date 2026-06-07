import type { FC } from "react";
import { cn } from "@/lib/utils";
import { RuleTicks } from "@/components/icons/almanac";

type Variant = "section" | "inline";

interface Props {
  /** Short mono-weight label displayed above the title as a kicker. */
  kicker?: string;
  title: string;
  subtitle?: string;
  className?: string;
  /** @deprecated Has no visual effect; ignored by the component. */
  accent?: boolean;
  /**
   * Controls layout variant.
   * - `"section"` (default): top border-rule, generous padding — for major
   *   page sections (Diary, Trackers, Progress).
   * - `"inline"`: no top border, tighter padding — for sub-sections inside
   *   cards or column layouts.
   */
  variant?: Variant;
}

/**
 * Three-voice section heading for the Gryffin editorial design system.
 *
 * Voice 1 — JetBrains Mono (`kicker`): disciplined data-register label.
 * Voice 2 — Spectral serif (`title`): editorial authority, warm character.
 * Voice 3 — Manrope sans (`subtitle`): readable supplementary text.
 *
 * A hairline rule above the section title reinforces the almanac ledger grid.
 */
const SectionHeader: FC<Props> = ({ kicker, title, subtitle, className, variant = "section" }) => (
  <div
    className={cn(
      "flex flex-col gap-0.5",
      variant === "section" ? "border-t border-rule pt-4 pb-3" : "pb-2",
      className,
    )}
  >
    {/* Kicker row — mono micro-label + RuleTicks ornament */}
    {kicker && (
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft leading-none select-none">
          {kicker}
        </span>
        <RuleTicks ticks={5} spacing={6} className="h-3 text-rule shrink-0" aria-hidden="true" />
      </div>
    )}

    {/* Title row — serif voice + optional subtitle */}
    <div className="flex items-baseline gap-3">
      <h2
        className={cn(
          "editorial-serif font-semibold leading-snug text-ink",
          "text-[clamp(1.125rem,1rem+0.6vw,1.4rem)]",
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft ml-auto shrink-0">
          {subtitle}
        </span>
      )}
    </div>
  </div>
);

export default SectionHeader;
