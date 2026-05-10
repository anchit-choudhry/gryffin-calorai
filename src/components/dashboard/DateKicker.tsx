import type { FC } from "react";

interface Props {
  date: Date;
}

const DateKicker: FC<Props> = ({ date }) => {
  const dow = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const mon = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const display = `${dow} · ${mon} ${day} · ${year}`;
  const fullLabel = date.toLocaleDateString("en-US", { dateStyle: "full" });

  return (
    <div className="flex items-center justify-center h-full py-4" aria-label={fullLabel}>
      <span className="sr-only">{fullLabel}</span>
      <span
        className="[writing-mode:vertical-rl] rotate-180 uppercase tracking-[0.3em] text-[10px] font-mono text-ink-soft select-none whitespace-nowrap"
        aria-hidden="true"
      >
        {display}
      </span>
    </div>
  );
};

export default DateKicker;
