import { detectFormat, splitCsvRow } from "./utils";
import { parseMfpCsv } from "./mfp";
import { parseCronometerCsv } from "./cronometer";
import { parseLoseItCsv } from "./loseit";

export type { ImportedFoodEntry, CsvFormat, ParseResult } from "./utils";
export { detectFormat, splitCsvRow } from "./utils";
export { parseMfpCsv } from "./mfp";
export { parseCronometerCsv } from "./cronometer";
export { parseLoseItCsv } from "./loseit";

export interface FullParseResult {
  format: "mfp" | "cronometer" | "loseit" | "unknown";
  entries: import("./utils").ImportedFoodEntry[];
  skippedRows: number;
}

/** Auto-detects format and parses the CSV string into food entries. */
export function parseImportCsv(csv: string): FullParseResult {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return { format: "unknown", entries: [], skippedRows: 0 };

  const headers = splitCsvRow(lines[0]!);
  const format = detectFormat(headers);

  switch (format) {
    case "mfp": {
      const result = parseMfpCsv(csv);
      return { format, ...result };
    }
    case "cronometer": {
      const result = parseCronometerCsv(csv);
      return { format, ...result };
    }
    case "loseit": {
      const result = parseLoseItCsv(csv);
      return { format, ...result };
    }
    default:
      return { format: "unknown", entries: [], skippedRows: lines.length - 1 };
  }
}
