import type { TooltipPayload } from "recharts";

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipPayload;
}

const ChartTooltip = ({ label, payload }: ChartTooltipProps) => (
  <div
    className="border px-3 py-2 shadow-sm font-mono text-[11px] text-ink"
    style={{
      background: "var(--chart-tooltip-bg)",
      borderColor: "var(--chart-tooltip-border)",
    }}
  >
    {label && (
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1">{label}</p>
    )}
    {payload?.map((p) => (
      <p key={String(p.name)} className="tabular-nums flex items-baseline gap-2">
        <span
          className="inline-block size-1.5 shrink-0"
          style={{ background: p.color ?? undefined }}
        />
        <span className="text-ink-soft">{p.name}</span>
        <span className="ml-auto text-ink font-semibold pl-3">
          {typeof p.value === "number" ? p.value.toLocaleString() : String(p.value ?? "")}
        </span>
      </p>
    ))}
  </div>
);

export default ChartTooltip;
