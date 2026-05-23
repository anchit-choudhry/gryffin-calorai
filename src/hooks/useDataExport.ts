import { useCallback, useState } from "react";
import { strToU8, zipSync } from "fflate";
import { useAppState } from "../state/AppState";
import type { BackupPayload } from "../db/dbService";

function todayStr() {
  return new Date().toISOString().split("T")[0]!;
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const s = val === null || val === undefined ? "" : String(val);
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(","),
    ),
  ];
  return lines.join("\n");
}

export function useDataExport() {
  const [isExporting, setIsExporting] = useState(false);
  const { exportData } = useAppState();

  const downloadJSON = useCallback(async () => {
    setIsExporting(true);
    try {
      const payload = await exportData();
      if (!payload) return;
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gryffin-backup-${todayStr()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, [exportData]);

  const downloadCSVZip = useCallback(async () => {
    setIsExporting(true);
    try {
      const payload = await exportData();
      if (!payload) return;
      const t = payload.tables;
      const files: Record<string, Uint8Array> = {
        "foodItems.csv": strToU8(toCSV(t.foodItems as unknown as Record<string, unknown>[])),
        "waterLogs.csv": strToU8(toCSV(t.waterLogs as unknown as Record<string, unknown>[])),
        "stepLogs.csv": strToU8(toCSV(t.stepLogs as unknown as Record<string, unknown>[])),
        "bodyMeasurements.csv": strToU8(
          toCSV(t.bodyMeasurements as unknown as Record<string, unknown>[]),
        ),
        "activityLogs.csv": strToU8(toCSV(t.activityLogs as unknown as Record<string, unknown>[])),
        "fastingSessions.csv": strToU8(
          toCSV(t.fastingSessions as unknown as Record<string, unknown>[]),
        ),
      };
      const zipped = zipSync(files);
      const blob = new Blob([new Uint8Array(zipped)], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gryffin-csv-${todayStr()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, [exportData]);

  return { downloadJSON, downloadCSVZip, isExporting };
}

export type { BackupPayload };
