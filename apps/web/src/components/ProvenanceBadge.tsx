import type { FC } from "react";
import { Camera, Mic, QrCode, RefreshCw, LayoutTemplate } from "lucide-react";
import type { CaptureMethod } from "@/types";
import { CAPTURE_METHOD_LABELS } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  method: CaptureMethod;
  className?: string;
}

const ICONS: Partial<Record<CaptureMethod, FC<{ className?: string }>>> = {
  voice: ({ className }) => <Mic className={className} aria-hidden="true" />,
  photo: ({ className }) => <Camera className={className} aria-hidden="true" />,
  barcode: ({ className }) => <QrCode className={className} aria-hidden="true" />,
  recurring: ({ className }) => <RefreshCw className={className} aria-hidden="true" />,
  template: ({ className }) => <LayoutTemplate className={className} aria-hidden="true" />,
};

export const ProvenanceBadge: FC<Props> = ({ method, className }) => {
  if (method === "manual") return null;

  const Icon = ICONS[method];
  const label = CAPTURE_METHOD_LABELS[method];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.15em] text-ink-soft/70 select-none",
        className,
      )}
      aria-label={`Logged via ${label}`}
    >
      {Icon && <Icon className="size-2.5 shrink-0" />}
      {label}
    </span>
  );
};
