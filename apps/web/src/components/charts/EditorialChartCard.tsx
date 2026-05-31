import type { FC, ReactNode } from "react";

type ChartType = "line" | "bar" | "pie";

interface Props {
  label?: string;
  height?: number;
  raised?: boolean;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  chartType?: ChartType;
  children: ReactNode;
}

function ChartSkeleton({ chartType }: { chartType: ChartType }) {
  if (chartType === "pie") {
    return (
      <div className="absolute inset-6 flex items-center justify-center animate-pulse">
        <div className="size-36 rounded-full bg-paper-muted" />
      </div>
    );
  }
  if (chartType === "line") {
    return (
      <div className="absolute inset-6 flex flex-col justify-end gap-0 animate-pulse">
        <div className="h-px w-full bg-rule mb-3" />
        {/* sparkline blob */}
        <svg viewBox="0 0 200 60" className="w-full h-16 text-paper-muted" aria-hidden="true">
          <path
            d="M0 50 C30 40 50 10 80 20 C110 30 130 5 160 15 C180 22 195 35 200 30"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
        </svg>
        <div className="h-2 w-1/3 bg-paper-muted mt-3" />
      </div>
    );
  }
  // bar (default)
  return (
    <div className="absolute inset-6 flex flex-col gap-3 animate-pulse">
      <div className="h-2 w-1/3 bg-paper-muted" />
      <div className="flex-1 flex items-end gap-2">
        {[0.7, 0.4, 0.85, 0.55, 0.65, 0.3, 0.75].map((h, i) => (
          <div key={i} className="flex-1 bg-paper-muted" style={{ height: `${h * 100}%` }} />
        ))}
      </div>
    </div>
  );
}

const EditorialChartCard: FC<Props> = ({
  label,
  height = 400,
  raised = false,
  isLoading,
  isEmpty,
  emptyMessage,
  chartType = "bar",
  children,
}) => (
  <div className={`@container border border-rule ${raised ? "bg-paper-raised" : ""}`}>
    {label && (
      <div className="px-5 pt-3 pb-2 border-b border-rule">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
          {label}
        </span>
      </div>
    )}
    <div className="p-4 @[400px]:p-6 text-ink-soft relative" style={{ height }}>
      {isLoading ? (
        <ChartSkeleton chartType={chartType} />
      ) : isEmpty ? (
        <div className="h-full flex items-center justify-center">
          <p className="font-mono text-xs text-ink-soft/60 text-center tracking-wide">
            {emptyMessage ?? "No data yet."}
          </p>
        </div>
      ) : (
        children
      )}
    </div>
  </div>
);

export default EditorialChartCard;
