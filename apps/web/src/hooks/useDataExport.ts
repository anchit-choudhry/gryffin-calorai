import { useCallback, useState } from "react";
import JSZip from "jszip";
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
      const zip = new JSZip();
      const csvTables: Array<[string, unknown[]]> = [
        ["foodItems.csv", t.foodItems],
        ["waterLogs.csv", t.waterLogs],
        ["stepLogs.csv", t.stepLogs],
        ["bodyMeasurements.csv", t.bodyMeasurements],
        ["activityLogs.csv", t.activityLogs],
        ["fastingSessions.csv", t.fastingSessions],
      ];
      for (const [name, rows] of csvTables) {
        zip.file(name, toCSV(rows));
      }
      const blob = await zip.generateAsync({ type: "blob" });
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
