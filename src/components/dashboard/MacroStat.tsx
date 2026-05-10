import type { FC } from "react";

interface Props {
  label: string;
  value: number;
  unit?: string;
}

const MacroStat: FC<Props> = ({ label, value, unit }) => (
  <div className="flex-1 border-l border-rule first:border-l-0 px-4 py-3">
    <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-ink-soft">{label}</p>
    <p className="font-display text-2xl tabular-nums mt-1 text-ink">
      {value.toLocaleString()}
      {unit && (
        <span className="font-mono text-[10px] tracking-widest text-ink-soft ml-1">{unit}</span>
      )}
    </p>
  </div>
);

export default MacroStat;
