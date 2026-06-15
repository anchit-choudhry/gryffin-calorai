import { describe, expect, it } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { parseAppleHealthExport } from "./appleHealth";
import type { UserId } from "@/types";

const UID = "u1" as UserId;

function makeZip(xml: string, path = "apple_health_export/export.xml"): ArrayBuffer {
  const zipped = zipSync({ [path]: strToU8(xml) });
  return zipped.buffer as ArrayBuffer;
}

function healthXml(records: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
${records}
</HealthData>`;
}

function weightRecord(date: string, value: string, unit = "kg"): string {
  return `<Record type="HKQuantityTypeIdentifierBodyMass" sourceName="Health" unit="${unit}" startDate="${date} 10:00:00 +0000" value="${value}"/>`;
}

function stepRecord(date: string, value: string): string {
  return `<Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" startDate="${date} 00:00:00 +0000" value="${value}"/>`;
}

describe("parseAppleHealthExport", () => {
  it("returns empty result when export.xml is missing from zip", () => {
    const zipped = zipSync({ "other_file.txt": strToU8("hello") });
    const result = parseAppleHealthExport(zipped.buffer as ArrayBuffer, UID);
    expect(result.weightEntries).toStrictEqual([]);
    expect(result.stepEntries).toStrictEqual([]);
    expect(result.skippedRecords).toBe(0);
  });

  it("parses weight record in kg", () => {
    const xml = healthXml(weightRecord("2026-01-01", "80.5", "kg"));
    const result = parseAppleHealthExport(makeZip(xml), UID);
    expect(result.weightEntries).toHaveLength(1);
    expect(result.weightEntries[0]!.weight).toBe(80.5);
    expect(result.weightEntries[0]!.measuredAt).toBe("2026-01-01");
    expect(result.weightEntries[0]!.userId).toBe(UID);
  });

  it("converts lb to kg", () => {
    const xml = healthXml(weightRecord("2026-01-01", "176.37", "lb"));
    const result = parseAppleHealthExport(makeZip(xml), UID);
    expect(result.weightEntries[0]!.weight).toBeCloseTo(79.98, 1);
  });

  it("deduplicates weight per day (keeps first record)", () => {
    const xml = healthXml(
      [weightRecord("2026-01-01", "80.5"), weightRecord("2026-01-01", "79.0")].join("\n"),
    );
    const result = parseAppleHealthExport(makeZip(xml), UID);
    expect(result.weightEntries).toHaveLength(1);
    expect(result.weightEntries[0]!.weight).toBe(80.5);
  });

  it("parses multiple weight entries on different days", () => {
    const xml = healthXml(
      [weightRecord("2026-01-01", "80"), weightRecord("2026-01-02", "79.8")].join("\n"),
    );
    const result = parseAppleHealthExport(makeZip(xml), UID);
    expect(result.weightEntries).toHaveLength(2);
  });

  it("parses step record", () => {
    const xml = healthXml(stepRecord("2026-01-01", "8534"));
    const result = parseAppleHealthExport(makeZip(xml), UID);
    expect(result.stepEntries).toHaveLength(1);
    expect(result.stepEntries[0]!.steps).toBe(8534);
    expect(result.stepEntries[0]!.dateLogged).toBe("2026-01-01");
  });

  it("aggregates step records per day from multiple sources", () => {
    const xml = healthXml(
      [stepRecord("2026-01-01", "5000"), stepRecord("2026-01-01", "3500")].join("\n"),
    );
    const result = parseAppleHealthExport(makeZip(xml), UID);
    expect(result.stepEntries).toHaveLength(1);
    expect(result.stepEntries[0]!.steps).toBe(8500);
  });

  it("rounds step totals to whole numbers", () => {
    const xml = healthXml(
      [stepRecord("2026-01-01", "5000.7"), stepRecord("2026-01-01", "3500.3")].join("\n"),
    );
    const result = parseAppleHealthExport(makeZip(xml), UID);
    expect(result.stepEntries[0]!.steps).toBe(8501);
  });

  it("counts unknown record types as skipped", () => {
    const xml = healthXml(
      `<Record type="HKQuantityTypeIdentifierHeartRate" unit="count/min" startDate="2026-01-01 10:00:00 +0000" value="72"/>`,
    );
    const result = parseAppleHealthExport(makeZip(xml), UID);
    expect(result.skippedRecords).toBe(1);
    expect(result.weightEntries).toHaveLength(0);
    expect(result.stepEntries).toHaveLength(0);
  });

  it("skips records with missing value attribute", () => {
    const xml = healthXml(
      `<Record type="HKQuantityTypeIdentifierBodyMass" unit="kg" startDate="2026-01-01 10:00:00 +0000"/>`,
    );
    const result = parseAppleHealthExport(makeZip(xml), UID);
    expect(result.skippedRecords).toBe(1);
  });

  it("skips records with invalid date format", () => {
    const xml = healthXml(
      `<Record type="HKQuantityTypeIdentifierBodyMass" unit="kg" startDate="not-a-date" value="80"/>`,
    );
    const result = parseAppleHealthExport(makeZip(xml), UID);
    expect(result.skippedRecords).toBe(1);
  });

  it("handles export.xml at root (no apple_health_export/ prefix)", () => {
    const xml = healthXml(weightRecord("2026-01-01", "75"));
    const result = parseAppleHealthExport(makeZip(xml, "export.xml"), UID);
    expect(result.weightEntries).toHaveLength(1);
  });

  it("returns empty entries for empty HealthData element", () => {
    const xml = healthXml("");
    const result = parseAppleHealthExport(makeZip(xml), UID);
    expect(result.weightEntries).toHaveLength(0);
    expect(result.stepEntries).toHaveLength(0);
    expect(result.skippedRecords).toBe(0);
  });

  it("handles export.xml at an alternate nested path", () => {
    const xml = healthXml(weightRecord("2026-01-01", "75"));
    const result = parseAppleHealthExport(makeZip(xml, "subdir/export.xml"), UID);
    expect(result.weightEntries).toHaveLength(1);
  });
});
