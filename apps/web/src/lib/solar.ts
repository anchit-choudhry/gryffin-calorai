export type Season = "Spring" | "Summer" | "Autumn" | "Winter";

export interface MoonPhaseResult {
  phase: number;
  label: string;
  emoji: string;
}

export interface SunTimes {
  sunrise: string;
  sunset: string;
}

const MOON_PHASES: ReadonlyArray<{ label: string; emoji: string }> = [
  { label: "New Moon", emoji: "🌑" },
  { label: "Waxing Crescent", emoji: "🌒" },
  { label: "First Quarter", emoji: "🌓" },
  { label: "Waxing Gibbous", emoji: "🌔" },
  { label: "Full Moon", emoji: "🌕" },
  { label: "Waning Gibbous", emoji: "🌖" },
  { label: "Last Quarter", emoji: "🌗" },
  { label: "Waning Crescent", emoji: "🌘" },
];

export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = target.getTime() - start.getTime();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor(diff / MS_PER_DAY);
}

export function getSeason(date: Date, hemisphere: "north" | "south"): Season {
  const month = date.getMonth() + 1;
  let northSeason: Season;
  if (month >= 3 && month <= 5) {
    northSeason = "Spring";
  } else if (month >= 6 && month <= 8) {
    northSeason = "Summer";
  } else if (month >= 9 && month <= 11) {
    northSeason = "Autumn";
  } else {
    northSeason = "Winter";
  }
  if (hemisphere === "north") return northSeason;
  const invert: Record<Season, Season> = {
    Spring: "Autumn",
    Summer: "Winter",
    Autumn: "Spring",
    Winter: "Summer",
  };
  return invert[northSeason];
}

export function getMoonPhase(date: Date): MoonPhaseResult {
  // Julian Day Number from local date fields; +0.5 shifts from JDN noon epoch to JDE midnight
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const a = Math.floor((14 - m) / 12);
  const yr = y + 4800 - a;
  const mo = m + 12 * a - 3;
  const jde =
    d +
    Math.floor((153 * mo + 2) / 5) +
    365 * yr +
    Math.floor(yr / 4) -
    Math.floor(yr / 100) +
    Math.floor(yr / 400) -
    32045 +
    0.5;

  const SYNODIC = 29.53059;
  const EPOCH = 2451550.1;
  let phase = ((jde - EPOCH) / SYNODIC) % 1;
  if (phase < 0) phase += 1;

  const index = Math.floor(phase * 8) % 8;
  const entry = MOON_PHASES[index];
  return { phase, label: entry?.label ?? "", emoji: entry?.emoji ?? "" };
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function decimalHoursToHHMM(decimal: number): string {
  const wrapped = ((decimal % 24) + 24) % 24;
  const hours = Math.floor(wrapped);
  const minutes = Math.round((wrapped - hours) * 60);
  if (minutes === 60) return `${pad(hours + 1)}:00`;
  return `${pad(hours)}:${pad(minutes)}`;
}

export function getSunTimes(date: Date, lat?: number, lng?: number): SunTimes | null {
  if (lat === undefined || lng === undefined) return null;

  const d = getDayOfYear(date);
  const DEG = Math.PI / 180;

  const declination = -23.45 * Math.cos((360 / 365) * (d + 10) * DEG);
  const cosH = -Math.tan(lat * DEG) * Math.tan(declination * DEG);

  // No sunrise/sunset at extreme latitudes
  if (cosH < -1 || cosH > 1) return null;

  const H = (Math.acos(cosH) * 180) / Math.PI;
  // Local solar time at the given coordinates (UTC adjusted for longitude only).
  // Device timezone is deliberately excluded so the display makes sense for saved locations.
  const sunriseDecimal = 12 - H / 15 - lng / 15;
  const sunsetDecimal = 12 + H / 15 - lng / 15;

  return {
    sunrise: decimalHoursToHHMM(sunriseDecimal),
    sunset: decimalHoursToHHMM(sunsetDecimal),
  };
}
