import { useRef, useState } from "react";
import { CheckCircle2, FileUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/state/AppState";
import { type AppleHealthResult, parseAppleHealthExport } from "@/lib/importers/appleHealth";
import {
  addBodyMeasurement as addBodyMeasurementToDB,
  addStepLog as addStepLogToDB,
} from "@/db/dbService";
import { cn } from "@/lib/utils";

const MAX_ZIP_BYTES = 200 * 1024 * 1024; // 200 MB

interface ParseState {
  result: AppleHealthResult;
  fileName: string;
}

export function AppleHealthImportPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userId = useAppState((s) => s.userId);
  const fetchBodyMeasurements = useAppState((s) => s.fetchBodyMeasurements);

  const [parsed, setParsed] = useState<ParseState | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(file: File) {
    if (file.size > MAX_ZIP_BYTES) {
      toast.error("File is too large. Maximum size is 200 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const buffer = e.target?.result;
      if (!(buffer instanceof ArrayBuffer) || !userId) return;
      try {
        const result = await parseAppleHealthExport(buffer, userId);
        setParsed({ result, fileName: file.name });
      } catch {
        toast.error("Could not read the Apple Health export. Make sure it is a valid .zip file.");
      }
    };
    reader.readAsArrayBuffer(file);
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
    if (file?.name.endsWith(".zip")) handleFile(file);
  }

  async function confirmImport() {
    if (!parsed || !userId) return;
    const { weightEntries, stepEntries } = parsed.result;
    if (weightEntries.length === 0 && stepEntries.length === 0) return;

    setIsImporting(true);
    try {
      for (const entry of weightEntries) {
        await addBodyMeasurementToDB({ ...entry, userId });
      }
      for (const entry of stepEntries) {
        await addStepLogToDB({ ...entry, userId });
      }
      if (weightEntries.length > 0) {
        await fetchBodyMeasurements(userId);
      }
      const total = weightEntries.length + stepEntries.length;
      toast.success(`Imported ${total} records from Apple Health`);
      setParsed(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Import failed. Some records may not have been saved.");
    } finally {
      setIsImporting(false);
    }
  }

  function dismiss() {
    setParsed(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const totalEntries = parsed
    ? parsed.result.weightEntries.length + parsed.result.stepEntries.length
    : 0;

  return (
    <div className="space-y-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-soft">Import from</p>
      <p className="font-sans text-xs text-ink-soft leading-relaxed">
        Import weight measurements and step counts from your Apple Health export. In the Health app,
        go to your profile and tap "Export All Health Data". Select the .zip file here.
      </p>

      {!parsed && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Select an Apple Health zip file to import"
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
            "flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed py-10 transition-colors",
            isDragging
              ? "border-persimmon bg-persimmon-soft"
              : "border-rule bg-paper-muted hover:border-ink-soft",
          )}
        >
          <FileUp className="size-5 text-ink-soft" aria-hidden="true" />
          <p className="font-sans text-sm text-ink-soft">
            Drop your Apple Health export here or{" "}
            <span className="text-persimmon underline underline-offset-2">browse</span>
          </p>
          <p className="font-mono text-[9px] uppercase tracking-widest text-ink-soft/60">
            Apple Health - export.zip
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        aria-label="Apple Health zip file input"
        className="sr-only"
        onChange={handleFileChange}
      />

      {parsed && (
        <div className="space-y-4">
          <div className="border border-rule p-4 space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2
                className="mt-0.5 size-3.5 shrink-0 text-emerald-500"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="font-sans text-sm text-ink">Apple Health detected</p>
                <p className="mt-0.5 truncate font-mono text-[10px] text-ink-soft">
                  {parsed.fileName}
                </p>
              </div>
            </div>

            <div className="flex gap-6 border-t border-rule/40 pt-3">
              {(
                [
                  ["Weight", String(parsed.result.weightEntries.length)],
                  ["Steps", String(parsed.result.stepEntries.length)],
                  ["Skipped", String(parsed.result.skippedRecords)],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft/60">
                    {label}
                  </p>
                  <p className="mt-1 font-serif text-2xl font-light leading-none text-ink">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={dismiss}
              disabled={isImporting}
              className="h-auto flex-1 rounded-none border-rule px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-ink-soft hover:border-ink hover:text-ink"
            >
              Cancel
            </Button>
            {totalEntries > 0 && (
              <Button
                type="button"
                onClick={confirmImport}
                disabled={isImporting}
                className="h-auto flex-1 rounded-none bg-persimmon px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-white hover:bg-persimmon/90"
              >
                {isImporting ? "Importing..." : `Import ${totalEntries} records`}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
