import { Plus } from "lucide-react";
import { useAppState } from "@/state/AppState";

export function QuickAddFab() {
  const openQuickAdd = useAppState((s) => s.openQuickAdd);

  return (
    <button
      type="button"
      onClick={openQuickAdd}
      aria-label="Quick add"
      className="absolute -top-5 left-1/2 flex size-12 -translate-x-1/2 items-center justify-center rounded-full border-2 border-paper bg-persimmon text-paper shadow-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-2"
    >
      <Plus className="size-5" aria-hidden="true" />
    </button>
  );
}
