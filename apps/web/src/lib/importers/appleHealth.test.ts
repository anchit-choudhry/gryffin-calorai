import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { parseAppleHealthExport } from "./appleHealth";
import type { UserId } from "@/types";

const UID = "u1" as UserId;

async function makeZip(xml: string, path = "apple_health_export/export.xml"): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file(path, xml);
  return zip.generateAsync({ type: "arraybuffer" });
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
  it("returns empty result when export.xml is missing from zip", async () => {
    const zip = new JSZip();
    zip.file("other_file.txt", "hello");
    const buffer = await zip.generateAsync({ type: "arraybuffer" });
    const result = await parseAppleHealthExport(buffer, UID);
    expect(result.weightEntries).toStrictEqual([]);
    expect(result.stepEntries).toStrictEqual([]);
    expect(result.skippedRecords).toBe(0);
  });

  it("parses weight record in kg", async () => {
    const xml = healthXml(weightRecord("2026-01-01", "80.5", "kg"));
    const result = await parseAppleHealthExport(await makeZip(xml), UID);
    expect(result.weightEntries).toHaveLength(1);
    expect(result.weightEntries[0]!.weight).toBe(80.5);
    expect(result.weightEntries[0]!.measuredAt).toBe("2026-01-01");
    expect(result.weightEntries[0]!.userId).toBe(UID);
  });

  it("converts lb to kg", async () => {
    const xml = healthXml(weightRecord("2026-01-01", "176.37", "lb"));
    const result = await parseAppleHealthExport(await makeZip(xml), UID);
    expect(result.weightEntries[0]!.weight).toBeCloseTo(79.98, 1);
  });

  it("deduplicates weight per day (keeps first record)", async () => {
    const xml = healthXml(
      [weightRecord("2026-01-01", "80.5"), weightRecord("2026-01-01", "79.0")].join("\n"),
    );
    const result = await parseAppleHealthExport(await makeZip(xml), UID);
    expect(result.weightEntries).toHaveLength(1);
    expect(result.weightEntries[0]!.weight).toBe(80.5);
  });

  it("parses multiple weight entries on different days", async () => {
    const xml = healthXml(
      [weightRecord("2026-01-01", "80"), weightRecord("2026-01-02", "79.8")].join("\n"),
    );
    const result = await parseAppleHealthExport(await makeZip(xml), UID);
    expect(result.weightEntries).toHaveLength(2);
  });

  it("parses step record", async () => {
    const xml = healthXml(stepRecord("2026-01-01", "8534"));
    const result = await parseAppleHealthExport(await makeZip(xml), UID);
    expect(result.stepEntries).toHaveLength(1);
    expect(result.stepEntries[0]!.steps).toBe(8534);
    expect(result.stepEntries[0]!.dateLogged).toBe("2026-01-01");
  });

  it("aggregates step records per day from multiple sources", async () => {
    const xml = healthXml(
      [stepRecord("2026-01-01", "5000"), stepRecord("2026-01-01", "3500")].join("\n"),
    );
    const result = await parseAppleHealthExport(await makeZip(xml), UID);
    expect(result.stepEntries).toHaveLength(1);
    expect(result.stepEntries[0]!.steps).toBe(8500);
  });

  it("rounds step totals to whole numbers", async () => {
    const xml = healthXml(
      [stepRecord("2026-01-01", "5000.7"), stepRecord("2026-01-01", "3500.3")].join("\n"),
    );
    const result = await parseAppleHealthExport(await makeZip(xml), UID);
    expect(result.stepEntries[0]!.steps).toBe(8501);
  });

  it("counts unknown record types as skipped", async () => {
    const xml = healthXml(
      `<Record type="HKQuantityTypeIdentifierHeartRate" unit="count/min" startDate="2026-01-01 10:00:00 +0000" value="72"/>`,
    );
    const result = await parseAppleHealthExport(await makeZip(xml), UID);
    expect(result.skippedRecords).toBe(1);
    expect(result.weightEntries).toHaveLength(0);
    expect(result.stepEntries).toHaveLength(0);
  });

  it("skips records with missing value attribute", async () => {
    const xml = healthXml(
      `<Record type="HKQuantityTypeIdentifierBodyMass" unit="kg" startDate="2026-01-01 10:00:00 +0000"/>`,
    );
    const result = await parseAppleHealthExport(await makeZip(xml), UID);
    expect(result.skippedRecords).toBe(1);
  });

  it("skips records with invalid date format", async () => {
    const xml = healthXml(
      `<Record type="HKQuantityTypeIdentifierBodyMass" unit="kg" startDate="not-a-date" value="80"/>`,
    );
    const result = await parseAppleHealthExport(await makeZip(xml), UID);
    expect(result.skippedRecords).toBe(1);
  });

  it("handles export.xml at root (no apple_health_export/ prefix)", async () => {
    const xml = healthXml(weightRecord("2026-01-01", "75"));
    const result = await parseAppleHealthExport(await makeZip(xml, "export.xml"), UID);
    expect(result.weightEntries).toHaveLength(1);
  });

  it("returns empty entries for empty HealthData element", async () => {
    const xml = healthXml("");
    const result = await parseAppleHealthExport(await makeZip(xml), UID);
    expect(result.weightEntries).toHaveLength(0);
    expect(result.stepEntries).toHaveLength(0);
    expect(result.skippedRecords).toBe(0);
  });

  it("handles export.xml at an alternate nested path", async () => {
    const xml = healthXml(weightRecord("2026-01-01", "75"));
    const result = await parseAppleHealthExport(await makeZip(xml, "subdir/export.xml"), UID);
    expect(result.weightEntries).toHaveLength(1);
  });
});
