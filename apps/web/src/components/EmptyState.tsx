import type { FC, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LABEL_MONO_CLS } from "@/lib/utils";

interface EmptyStateProps {
  illustration?: ReactNode;
  eyebrow?: string;
  heading: string;
  body?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "illustrated" | "quiet";
  className?: string;
}

export const EmptyState: FC<EmptyStateProps> = ({
  illustration,
  eyebrow,
  heading,
  body,
  action,
  variant = "illustrated",
  className = "",
}) => {
  const isQuiet = variant === "quiet";

  return (
    <div
      className={[
        "flex flex-col items-center justify-center text-center",
        isQuiet ? "gap-2 py-8" : "gap-5 py-12 px-6",
        className,
      ].join(" ")}
    >
      {!isQuiet && illustration && (
        <div className="text-ink-soft/40 w-24 h-24 flex items-center justify-center">
          {illustration}
        </div>
      )}
      {eyebrow && (
        <p className={`${LABEL_MONO_CLS} ${isQuiet ? "text-ink-soft/40" : ""}`}>{eyebrow}</p>
      )}
      <h3
        className={[
          "font-display font-light text-ink leading-tight",
          isQuiet ? "text-sm text-ink-soft" : "text-xl",
        ].join(" ")}
      >
        {heading}
      </h3>
      {body && !isQuiet && <p className="font-mono text-xs text-ink-soft max-w-xs">{body}</p>}
      {action && !isQuiet && (
        <Button variant="persimmon" size="sm" className="mt-2" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};
