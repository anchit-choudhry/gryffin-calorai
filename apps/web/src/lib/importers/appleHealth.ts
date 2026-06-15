import { unzipSync } from "fflate";
import type { BodyMeasurement, StepLog } from "@/db/dbService";
import type { ISODate, UserId } from "@/types";

const BODY_MASS_TYPE = "HKQuantityTypeIdentifierBodyMass";
const STEP_COUNT_TYPE = "HKQuantityTypeIdentifierStepCount";
const LB_TO_KG = 0.45359237;
// Blocks ZIP bombs (typical bombs expand to TB); allows realistic large exports
const MAX_XML_DECOMPRESSED_BYTES = 512 * 1024 * 1024;

export interface AppleHealthResult {
  weightEntries: Omit<BodyMeasurement, "id">[];
  stepEntries: Omit<StepLog, "id">[];
  skippedRecords: number;
}

function parseHkDate(dateStr: string): ISODate | undefined {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(dateStr);
  return match ? (match[1] as ISODate) : undefined;
}

function toKg(value: number, unit: string): number {
  return unit.toLowerCase().startsWith("lb") ? value * LB_TO_KG : value;
}

export function parseAppleHealthExport(buffer: ArrayBuffer, userId: UserId): AppleHealthResult {
  const files = unzipSync(new Uint8Array(buffer));

  const xmlBytes =
    files["apple_health_export/export.xml"] ??
    files["export.xml"] ??
    Object.entries(files).find(([path]) => path.endsWith("export.xml"))?.[1];

  if (!xmlBytes || xmlBytes.byteLength > MAX_XML_DECOMPRESSED_BYTES) {
    return { weightEntries: [], stepEntries: [], skippedRecords: 0 };
  }

  const xmlText = new TextDecoder("utf-8").decode(xmlBytes);
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");

  const weightEntries: Omit<BodyMeasurement, "id">[] = [];
  const seenWeightDates = new Set<string>();
  const stepsByDay = new Map<string, number>();
  let skippedRecords = 0;

  for (const record of doc.querySelectorAll("Record")) {
    const type = record.getAttribute("type");
    const valueStr = record.getAttribute("value");
    const startDate = record.getAttribute("startDate");

    if (!valueStr || !startDate) {
      skippedRecords++;
      continue;
    }

    const date = parseHkDate(startDate);
    if (!date) {
      skippedRecords++;
      continue;
    }

    const value = parseFloat(valueStr);
    if (isNaN(value)) {
      skippedRecords++;
      continue;
    }

    if (type === BODY_MASS_TYPE) {
      if (!seenWeightDates.has(date)) {
        seenWeightDates.add(date);
        const unit = record.getAttribute("unit") ?? "kg";
        weightEntries.push({
          userId,
          measuredAt: date,
          weight: parseFloat(toKg(value, unit).toFixed(2)),
        });
      }
    } else if (type === STEP_COUNT_TYPE) {
      stepsByDay.set(date, (stepsByDay.get(date) ?? 0) + value);
    } else {
      skippedRecords++;
    }
  }

  const now = new Date().toISOString();
  const stepEntries: Omit<StepLog, "id">[] = [...stepsByDay.entries()].map(([date, steps]) => ({
    userId,
    steps: Math.round(steps),
    dateLogged: date as ISODate,
    loggedAt: now,
  }));

  return { weightEntries, stepEntries, skippedRecords };
}
