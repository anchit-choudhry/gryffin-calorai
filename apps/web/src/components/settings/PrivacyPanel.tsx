import { useState } from "react";
import { Shield, Database, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { db } from "@/db/dbService";
import { cn } from "@/lib/utils";

const DATA_CATEGORIES = [
  { label: "Food log entries", description: "Meals and calories logged by date" },
  { label: "Recipes", description: "Custom recipes and ingredients" },
  { label: "Body measurements", description: "Weight, waist, and other metrics" },
  { label: "Water logs", description: "Daily water intake records" },
  { label: "Step & activity logs", description: "Steps and workout sessions" },
  { label: "Fasting sessions", description: "Intermittent fasting history" },
  { label: "Settings & profile", description: "TDEE profile, goals, and preferences" },
];

export function PrivacyPanel() {
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClearAll = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setClearing(true);
    try {
      await db.delete();
      toast.success("All local data cleared. Reloading...");
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      setClearing(false);
      setConfirmClear(false);
      toast.error("Failed to clear data - try again");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Shield className="w-4 h-4 text-persimmon mt-0.5 shrink-0" aria-hidden="true" />
        <p className="font-sans text-sm text-ink-soft leading-relaxed">
          All data is stored <span className="text-ink font-medium">only on this device</span>, in
          your browser's IndexedDB. Nothing is sent to any server unless you enable Cloud Sync.
        </p>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-3.5 h-3.5 text-ink-soft" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">
            Stored locally
          </span>
        </div>
        <div className="border border-rule divide-y divide-rule">
          {DATA_CATEGORIES.map(({ label, description }) => (
            <div key={label} className="flex items-start justify-between px-4 py-2.5 gap-4">
              <span className="font-sans text-sm text-ink">{label}</span>
              <span className="font-sans text-xs text-ink-soft text-right shrink-0">
                {description}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-rule p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Trash2 className="w-3.5 h-3.5 text-ink-soft" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">
            Clear all local data
          </span>
        </div>
        <p className="font-sans text-xs text-ink-soft">
          Permanently deletes all food logs, body measurements, recipes, and settings from this
          device. This cannot be undone. Export a backup first if needed.
        </p>
        {confirmClear && (
          <div className="flex items-start gap-2 border border-amber-500/40 bg-amber-500/5 p-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="font-sans text-xs text-ink">
              All data will be permanently deleted. This cannot be undone.
            </p>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            disabled={clearing}
            onClick={handleClearAll}
            className={cn(
              "rounded-none h-auto px-4 py-2 font-mono text-[10px] uppercase tracking-wider",
              confirmClear
                ? "bg-red-600 text-white hover:bg-red-700"
                : "border border-rule text-ink-soft hover:text-ink bg-transparent",
            )}
          >
            {clearing
              ? "Clearing..."
              : confirmClear
                ? "Confirm - delete everything"
                : "Clear all data"}
          </Button>
          {confirmClear && !clearing && (
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="font-mono text-[10px] uppercase tracking-wider text-ink-soft hover:text-ink transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
