import { AlertTriangle, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDataExport } from "../hooks/useDataExport";
import { useDataImport } from "../hooks/useDataImport";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  } = useDataImport();

  return (
    <div className="space-y-6">
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

      {/* Confirm import dialog */}
      <Dialog open={!!pendingPayload} onOpenChange={(o) => !o && cancelImport()}>
        <DialogContent className="sm:max-w-md rounded-none border border-rule bg-paper">
          <DialogHeader>
            <DialogTitle className="font-sans text-lg font-semibold text-ink flex items-center gap-2">
              <AlertTriangle className="size-4 text-persimmon" />
              Confirm Import
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="font-sans text-sm text-ink-soft">
              This will merge the backup with your existing data. Existing records will not be
              overwritten - only new records are added.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={cancelImport}
                className="font-mono text-[10px] uppercase tracking-wider text-ink-soft rounded-none h-auto px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmImport}
                disabled={isImporting}
                className="bg-ink text-paper font-mono text-[10px] uppercase tracking-wider rounded-none h-auto px-4 py-2 hover:bg-ink/90"
              >
                {isImporting ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataExportPanel;
