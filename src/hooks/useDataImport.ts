import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { BackupSchema } from "../forms/schemas";
import { useAppState } from "../state/AppState";
import { BACKUP_VERSION, type BackupPayload } from "../db/dbService";

export function useDataImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<unknown>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importData } = useAppState();

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
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
    const result = BackupSchema.safeParse(pendingPayload);
    if (!result.success) return;
    setIsImporting(true);
    setPendingPayload(null);
    try {
      const importResult = await importData(result.data as unknown as BackupPayload);
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
