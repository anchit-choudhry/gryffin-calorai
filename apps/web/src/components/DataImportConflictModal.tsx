import type { FC } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ConflictSummary } from "../db/dbService";

interface TableRowProps {
  label: string;
  incoming: number;
  existing: number;
}

const TABLE_LABELS: Record<keyof ConflictSummary, string> = {
  foodItems: "Food Items",
  recipes: "Recipes",
  waterLogs: "Water Logs",
  bodyMeasurements: "Body Measurements",
  stepLogs: "Step Logs",
  activityLogs: "Activity Logs",
  fastingSessions: "Fasting Sessions",
};

const ConflictRow: FC<TableRowProps> = ({ label, incoming, existing }) => {
  if (incoming === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-2 text-xs font-sans py-1.5 border-b border-rule last:border-0">
      <span className="text-ink">{label}</span>
      <span className="text-center tabular-nums text-ink-soft">{existing}</span>
      <span className="text-center tabular-nums font-medium text-ink">+{incoming}</span>
    </div>
  );
};

interface DataImportConflictModalProps {
  open: boolean;
  conflicts: ConflictSummary | null;
  isImporting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DataImportConflictModal: FC<DataImportConflictModalProps> = ({
  open,
  conflicts,
  isImporting,
  onConfirm,
  onCancel,
}) => {
  const totalIncoming = conflicts
    ? Object.values(conflicts).reduce((sum, e) => sum + e.incoming, 0)
    : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md rounded-none border border-rule bg-paper">
        <DialogHeader>
          <DialogTitle className="font-sans text-lg font-semibold text-ink flex items-center gap-2">
            <AlertTriangle className="size-4 text-persimmon" />
            Confirm Import
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="font-sans text-sm text-ink-soft">
            The backup will be merged with your existing data. Existing records will not be
            overwritten - only new records are added.
          </p>

          {conflicts && totalIncoming > 0 && (
            <div className="border border-rule p-3 space-y-1">
              <div className="grid grid-cols-3 gap-2 mb-2">
                <span className="font-mono text-[9px] uppercase tracking-widest text-ink-soft">
                  Table
                </span>
                <span className="text-center font-mono text-[9px] uppercase tracking-widest text-ink-soft">
                  Current
                </span>
                <span className="text-center font-mono text-[9px] uppercase tracking-widest text-ink-soft">
                  Adding
                </span>
              </div>
              {(Object.keys(TABLE_LABELS) as (keyof ConflictSummary)[]).map((key) => (
                <ConflictRow
                  key={key}
                  label={TABLE_LABELS[key]}
                  incoming={conflicts[key].incoming}
                  existing={conflicts[key].existing}
                />
              ))}
            </div>
          )}

          {totalIncoming === 0 && (
            <p className="font-sans text-sm text-ink-soft/60 italic">
              The backup contains no records to import.
            </p>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="font-mono text-[10px] uppercase tracking-wider text-ink-soft rounded-none h-auto px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isImporting || totalIncoming === 0}
              className="bg-ink text-paper font-mono text-[10px] uppercase tracking-wider rounded-none h-auto px-4 py-2 hover:bg-ink/90 disabled:opacity-50"
            >
              {isImporting ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataImportConflictModal;
