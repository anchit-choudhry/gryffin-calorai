import { useState } from "react";
import { useAppState } from "@/state/AppState";
import { getDayOfYear, getMoonPhase, getSeason, getSunTimes } from "@/lib/solar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const LABEL_CLS = "font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft block mb-1";
const VALUE_CLS = "font-mono text-lg text-ink tabular-nums";

function AlmanacCell({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col justify-center px-4 py-3 border-r border-rule", className)}>
      <span className={LABEL_CLS}>{label}</span>
      {children}
    </div>
  );
}

export function AlmanacPanel(): React.JSX.Element {
  const { selectedDate, almanacLocation, setAlmanacLocation } = useAppState();
  const [labelInput, setLabelInput] = useState("");
  const [coordInput, setCoordInput] = useState("");
  const [coordError, setCoordError] = useState<string | null>(null);

  const date = new Date(selectedDate + "T12:00:00");
  const dayOfYear = getDayOfYear(date);
  const season = getSeason(date, "north");
  const moon = getMoonPhase(date);
  const sunTimes = almanacLocation
    ? getSunTimes(date, almanacLocation.lat, almanacLocation.lng)
    : null;

  function handleSaveLocation(e: React.FormEvent) {
    e.preventDefault();
    setCoordError(null);
    const parts = coordInput.split(",").map((s) => s.trim());
    const lat = parseFloat(parts[0] ?? "");
    const lng = parseFloat(parts[1] ?? "");
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setCoordError("Latitude must be between -90 and 90.");
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setCoordError("Longitude must be between -180 and 180.");
      return;
    }
    setAlmanacLocation({ lat, lng, label: labelInput.trim() || coordInput.trim() });
    setLabelInput("");
    setCoordInput("");
  }

  const SEASON_ICONS: Record<string, string> = {
    Spring: "🌱",
    Summer: "☀️",
    Autumn: "🍂",
    Winter: "❄️",
  };

  return (
    <section aria-label="Almanac">
      <div className="flex border border-rule border-b-0">
        <AlmanacCell label="Day" className="min-w-[72px]">
          <span className={VALUE_CLS}>{dayOfYear}</span>
        </AlmanacCell>

        <AlmanacCell label="Season">
          <span className={cn(VALUE_CLS, "text-base flex items-center gap-1")}>
            <span aria-hidden="true">{SEASON_ICONS[season]}</span>
            <span>{season}</span>
          </span>
        </AlmanacCell>

        <AlmanacCell label="Moon">
          <span className={cn(VALUE_CLS, "text-base flex items-center gap-1")}>
            <span aria-hidden="true">{moon.emoji}</span>
            <span>{moon.label}</span>
          </span>
        </AlmanacCell>

        <AlmanacCell label="Sun" className="flex-1 border-r-0">
          {sunTimes ? (
            <span className={cn(VALUE_CLS, "text-base flex items-center gap-1")}>
              <span>{sunTimes.sunrise}</span>
              <span className="text-ink-soft mx-1" aria-hidden="true">
                -
              </span>
              <span>{sunTimes.sunset}</span>
            </span>
          ) : (
            <span className={cn(VALUE_CLS, "text-base flex items-center gap-1")}>
              <span>--:--</span>
              <span className="text-ink-soft mx-1" aria-hidden="true">
                -
              </span>
              <span>--:--</span>
            </span>
          )}
        </AlmanacCell>
      </div>

      <details className="border border-rule border-t-0 group">
        <summary className="cursor-pointer px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft select-none list-none hover:text-ink transition-colors">
          Set location
        </summary>
        <form onSubmit={handleSaveLocation} className="px-4 pb-4 pt-2 flex flex-col gap-3">
          <div>
            <label
              htmlFor="almanac-label"
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft block mb-1"
            >
              City or place name
            </label>
            <Input
              id="almanac-label"
              type="text"
              placeholder="City or place name"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="almanac-coords"
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft block mb-1"
            >
              Latitude, Longitude
            </label>
            <Input
              id="almanac-coords"
              type="text"
              placeholder="51.5, -0.1"
              value={coordInput}
              onChange={(e) => setCoordInput(e.target.value)}
            />
            {coordError && (
              <p className="mt-1 font-mono text-[10px] text-red-500" role="alert">
                {coordError}
              </p>
            )}
          </div>
          <button
            type="submit"
            aria-label="Save location"
            className="self-start font-mono text-[10px] uppercase tracking-[0.2em] text-persimmon hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon"
          >
            Save location
          </button>
          <p className="font-mono text-[10px] text-ink-soft/50">
            Your location stays on this device and is never shared.
          </p>
        </form>
      </details>
    </section>
  );
}
