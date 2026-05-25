import type { FC, ReactNode } from "react";

interface Props {
  label?: string;
  height?: number;
  raised?: boolean;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
}

const EditorialChartCard: FC<Props> = ({
  label,
  height = 400,
  raised = false,
  isLoading,
  isEmpty,
  emptyMessage,
  children,
}) => (
  <div className={`border border-rule ${raised ? "bg-paper-raised" : ""}`}>
    {label && (
      <div className="px-5 pt-3 pb-2 border-b border-rule">
        <span className="text-xs text-ink-soft font-sans">{label}</span>
      </div>
    )}
    <div className="p-6 text-ink-soft relative" style={{ height }}>
      {isLoading ? (
        <div className="absolute inset-6 animate-pulse flex flex-col gap-3">
          <div className="h-2 w-1/3 bg-paper-muted" />
          <div className="flex-1 bg-paper-muted/60" />
        </div>
      ) : isEmpty ? (
        <div className="h-full flex items-center justify-center">
          <p className="font-sans text-base text-ink-soft text-center">
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
