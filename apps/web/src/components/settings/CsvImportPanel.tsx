import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/state/AppState";
import type { FullParseResult } from "@/lib/importers";
import { parseImportCsv } from "@/lib/importers";
import { isISODate } from "@/lib/importers/utils";
import { cn } from "@/lib/utils";

const MAX_CSV_BYTES = 50 * 1024 * 1024; // 50 MB

const FORMAT_LABELS: Record<FullParseResult["format"], string> = {
  mfp: "MyFitnessPal",
  cronometer: "Cronometer",
  loseit: "Lose It!",
  unknown: "Unknown",
};

interface ParseState {
  result: FullParseResult;
  fileName: string;
}

export function CsvImportPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFoodLog = useAppState((s) => s.addFoodLog);
  const userId = useAppState((s) => s.userId);

  const [parsed, setParsed] = useState<ParseState | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(file: File) {
    if (file.size > MAX_CSV_BYTES) {
      toast.error("File is too large. Maximum size is 50 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== "string") return;
      const result = parseImportCsv(text);
      setParsed({ result, fileName: file.name });
    };
    reader.readAsText(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) handleFile(file);
  }

  async function confirmImport() {
    if (!parsed || parsed.result.format === "unknown" || !userId) return;
    setIsImporting(true);
    try {
      let successCount = 0;
      for (const entry of parsed.result.entries) {
        if (!isISODate(entry.dateLogged)) continue;
        await addFoodLog({
          name: entry.name,
          calories: entry.calories,
          servingSize: 1,
          dateLogged: entry.dateLogged,
          userId,
          isFavorite: false,
          mealType: entry.mealType,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
          nutritionData:
            entry.fiber !== undefined || entry.sodium !== undefined || entry.sugar !== undefined
              ? { fiber: entry.fiber, sodium: entry.sodium, sugar: entry.sugar }
              : undefined,
        });
        successCount++;
      }
      toast.success(`Imported ${successCount} entries from ${FORMAT_LABELS[parsed.result.format]}`);
      setParsed(null);
    } catch {
      toast.error("Import failed. Some entries may not have been saved.");
    } finally {
      setIsImporting(false);
    }
  }

  function dismiss() {
    setParsed(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-soft">Import from</p>
      <p className="font-sans text-xs text-ink-soft leading-relaxed">
        Import food diary entries from MyFitnessPal, Cronometer, or Lose It! Export a CSV from your
        app, then select it here. Duplicate entries are not detected - import once per export file.
      </p>

      {/* Drop zone / file picker */}
      {!parsed && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Select a CSV file to import"
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-3 border border-dashed py-10 transition-colors cursor-pointer",
            isDragging
              ? "border-persimmon bg-persimmon-soft"
              : "border-rule bg-paper-muted hover:border-ink-soft",
          )}
        >
          <FileUp className="size-5 text-ink-soft" aria-hidden="true" />
          <p className="font-sans text-sm text-ink-soft">
            Drop a CSV file here or{" "}
            <span className="text-persimmon underline underline-offset-2">browse</span>
          </p>
          <p className="font-mono text-[9px] text-ink-soft/60 uppercase tracking-widest">
            MyFitnessPal - Cronometer - Lose It!
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        aria-label="CSV file input"
        className="sr-only"
        onChange={handleFileChange}
      />

      {/* Parse result preview */}
      {parsed && (
        <div className="space-y-4">
          <div
            className={cn(
              "border p-4 space-y-3",
              parsed.result.format === "unknown" ? "border-amber-700/40" : "border-rule",
            )}
          >
            {parsed.result.format === "unknown" ? (
              <div className="flex items-start gap-2">
                <AlertCircle
                  className="size-3.5 mt-0.5 shrink-0 text-amber-600"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-sans text-sm text-ink">Unrecognized format</p>
                  <p className="font-mono text-[10px] text-ink-soft mt-1">
                    {parsed.fileName} - headers did not match MFP, Cronometer, or Lose It! exports.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <CheckCircle2
                  className="size-3.5 mt-0.5 shrink-0 text-emerald-500"
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm text-ink">
                    {FORMAT_LABELS[parsed.result.format]} detected
                  </p>
                  <p className="font-mono text-[10px] text-ink-soft mt-0.5 truncate">
                    {parsed.fileName}
                  </p>
                </div>
              </div>
            )}

            {parsed.result.format !== "unknown" && (
              <div className="flex gap-6 border-t border-rule/40 pt-3">
                {(
                  [
                    ["Entries", String(parsed.result.entries.length)],
                    ["Skipped", String(parsed.result.skippedRows)],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft/60">
                      {label}
                    </p>
                    <p className="font-serif text-2xl font-light text-ink leading-none mt-1">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={dismiss}
              disabled={isImporting}
              className="flex-1 border-rule font-mono text-[10px] uppercase tracking-wider text-ink-soft rounded-none h-auto px-4 py-2 hover:border-ink hover:text-ink"
            >
              Cancel
            </Button>
            {parsed.result.format !== "unknown" && parsed.result.entries.length > 0 && (
              <Button
                type="button"
                onClick={confirmImport}
                disabled={isImporting}
                className="flex-1 bg-persimmon text-white font-mono text-[10px] uppercase tracking-wider rounded-none h-auto px-4 py-2 hover:bg-persimmon/90"
              >
                {isImporting ? "Importing..." : `Import ${parsed.result.entries.length} entries`}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
