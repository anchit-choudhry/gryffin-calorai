import { Download, Lock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDataExport } from "../hooks/useDataExport";
import { useDataImport } from "../hooks/useDataImport";
import DataImportConflictModal from "./DataImportConflictModal";

const DataExportPanel = () => {
  const { downloadJSON, downloadCSVZip, isExporting } = useDataExport();
  const {
    fileInputRef,
    openFilePicker,
    handleFileChange,
    confirmImport,
    cancelImport,
    isImporting,
    pendingPayload,
    conflicts,
  } = useDataImport();

  return (
    <div className="space-y-6">
      {/* Data storage notice */}
      <div className="flex gap-3 border border-rule p-4">
        <Lock className="size-3 mt-0.5 shrink-0 text-ink-soft" />
        <p className="font-sans text-xs text-ink-soft leading-relaxed">
          All health data is stored locally in your browser without encryption. Do not use this app
          on shared or public computers. Export and store your backup files securely.
        </p>
      </div>

      {/* Export */}
      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-soft mb-3">
          Export
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={downloadJSON}
            disabled={isExporting}
            className="flex items-center gap-2 border-rule font-mono text-[10px] uppercase tracking-wider text-ink rounded-none h-auto px-4 py-2 hover:border-ink"
          >
            <Download className="size-3" />
            {isExporting ? "Exporting..." : "JSON Backup"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={downloadCSVZip}
            disabled={isExporting}
            className="flex items-center gap-2 border-rule font-mono text-[10px] uppercase tracking-wider text-ink rounded-none h-auto px-4 py-2 hover:border-ink"
          >
            <Download className="size-3" />
            {isExporting ? "Exporting..." : "CSV Tables (.zip)"}
          </Button>
        </div>
        <p className="font-sans text-xs text-ink-soft/60 mt-2">
          JSON backup can be re-imported. CSV is for spreadsheet use only.
        </p>
      </div>

      {/* Import */}
      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-soft mb-3">
          Import
        </h3>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Import backup file"
        />
        <Button
          type="button"
          variant="outline"
          onClick={openFilePicker}
          disabled={isImporting}
          className="flex items-center gap-2 border-rule font-mono text-[10px] uppercase tracking-wider text-ink rounded-none h-auto px-4 py-2 hover:border-ink"
        >
          <Upload className="size-3" />
          {isImporting ? "Importing..." : "Import JSON Backup"}
        </Button>
        <p className="font-sans text-xs text-ink-soft/60 mt-2">
          Merges with existing data - does not replace it.
        </p>
      </div>

      <DataImportConflictModal
        open={!!pendingPayload}
        conflicts={conflicts}
        isImporting={isImporting}
        onConfirm={confirmImport}
        onCancel={cancelImport}
      />
    </div>
  );
};

export default DataExportPanel;
