import { X } from "lucide-react";
import { useAppState } from "@/state/AppState";
import { CONTEXTUAL_COACHMARKS } from "./tourSteps";

interface Props {
  coachmarkId: string;
}

export function ContextualCoachmark({ coachmarkId }: Props) {
  const seenCoachmarks = useAppState((s) => s.seenCoachmarks);
  const markCoachmarkSeen = useAppState((s) => s.markCoachmarkSeen);

  const def = CONTEXTUAL_COACHMARKS.find((c) => c.id === coachmarkId);
  if (!def || seenCoachmarks.includes(coachmarkId)) return null;

  return (
    <aside role="note" className="flex gap-3 border-l-2 border-persimmon bg-paper-raised px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-persimmon">
          {def.title}
        </p>
        <p className="font-sans text-xs text-ink-soft">{def.body}</p>
      </div>
      <button
        type="button"
        onClick={() => markCoachmarkSeen(coachmarkId)}
        aria-label="Dismiss tip"
        className="shrink-0 text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </aside>
  );
}
