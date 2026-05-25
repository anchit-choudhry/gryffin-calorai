import type { LegendPayload } from "recharts";

interface Props {
  payload?: ReadonlyArray<LegendPayload>;
}

const ChartLegend = ({ payload }: Props) => (
  <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1 pt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
    {payload?.map((p) => (
      <li key={String(p.value)} className="flex items-center gap-1.5">
        <span className="inline-block w-3 h-[2px]" style={{ background: p.color }} />
        {p.value}
      </li>
    ))}
  </ul>
);

export default ChartLegend;
