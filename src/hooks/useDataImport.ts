import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { BackupSchema, type ParsedBackup } from "../forms/schemas";
import { useAppState } from "../state/AppState";
import { BACKUP_VERSION, type BackupPayload } from "../db/dbService";

const MAX_BACKUP_BYTES = 50 * 1024 * 1024;

export function useDataImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<ParsedBackup | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importData } = useAppState();

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.size > MAX_BACKUP_BYTES) {
      toast.error("Backup file exceeds the 50 MB size limit.");
      return;
    }
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      const result = BackupSchema.safeParse(parsed);
      if (!result.success) {
        toast.error("Invalid backup file format.");
        return;
      }
      if (result.data.version !== BACKUP_VERSION) {
        toast.error(
          `Backup version mismatch (got v${result.data.version}, expected v${BACKUP_VERSION}). Cannot import.`,
        );
        return;
      }
      setPendingPayload(result.data);
    } catch {
      toast.error("Failed to read backup file.");
    }
  }, []);

  const confirmImport = useCallback(async () => {
    if (!pendingPayload) return;
    setIsImporting(true);
    setPendingPayload(null);
    try {
      const importResult = await importData(pendingPayload as unknown as BackupPayload);
      if (importResult) {
        const total = Object.values(importResult.imported).reduce((a, b) => a + b, 0);
        toast.success(
          `Imported ${total} records${importResult.skipped > 0 ? `, ${importResult.skipped} skipped` : ""}.`,
        );
      }
    } finally {
      setIsImporting(false);
    }
  }, [pendingPayload, importData]);

  const cancelImport = useCallback(() => {
    setPendingPayload(null);
  }, []);

  return {
    fileInputRef,
    openFilePicker,
    handleFileChange,
    confirmImport,
    cancelImport,
    isImporting,
    pendingPayload,
  };
}
