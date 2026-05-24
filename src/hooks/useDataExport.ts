import { useCallback, useState } from "react";
import { strToU8, zipSync } from "fflate";
import { useAppState } from "../state/AppState";
import type { BackupPayload } from "../db/dbService";

function todayStr() {
  return new Date().toISOString().split("T")[0]!;
}

export function toCSV(rows: unknown[]): string {
  if (rows.length === 0) return "";
  const first = rows[0] as Record<string, unknown>;
  const headers = Object.keys(first);
  const lines = [
    headers.join(","),
    ...rows.map((row) => {
      const record = row as Record<string, unknown>;
      return headers
        .map((h) => {
          const val = record[h];
          const s = val === null || val === undefined ? "" : String(val);
          // Neutralize spreadsheet formula injection: prefix with tab and always quote so
          // Excel/Calc/Sheets cannot evaluate the value as a formula regardless of whitespace
          // stripping behavior.
          const injected = /^[=+\-@\t\r]/.test(s);
          const safe = injected ? `\t${s}` : s;
          return injected || safe.includes(",") || safe.includes('"') || safe.includes("\n")
            ? `"${safe.replace(/"/g, '""')}"`
            : safe;
        })
        .join(",");
    }),
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
        "foodItems.csv": strToU8(toCSV(t.foodItems)),
        "waterLogs.csv": strToU8(toCSV(t.waterLogs)),
        "stepLogs.csv": strToU8(toCSV(t.stepLogs)),
        "bodyMeasurements.csv": strToU8(toCSV(t.bodyMeasurements)),
        "activityLogs.csv": strToU8(toCSV(t.activityLogs)),
        "fastingSessions.csv": strToU8(toCSV(t.fastingSessions)),
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
