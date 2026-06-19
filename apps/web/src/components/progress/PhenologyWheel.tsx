import { useMemo } from "react";
import type { FC } from "react";
import type { FoodItem } from "@/db/dbService";
import type { UserAchievement } from "@/db/dbService";
import type { BodyMeasurement } from "@/db/dbService";
import { ACHIEVEMENTS } from "@/lib/achievements";

const SIZE = 480;
const CX = SIZE / 2;
const CY = SIZE / 2;

const R = {
  outer: 218,
  tick: 206,
  month: 192,
  weight: 168,
  weightMin: 100,
  weightMax: 168,
  adherence: 84,
  inner: 56,
  center: 20,
} as const;

const C = {
  rule: "oklch(0.82 0.015 75)",
  ink: "oklch(0.18 0.020 60)",
  inkSoft: "oklch(0.55 0.018 60)",
  persimmon: "oklch(0.65 0.190 38)",
  persimmonFaint: "oklch(0.93 0.048 40)",
  paper: "oklch(0.975 0.012 80)",
  sage: "oklch(0.55 0.08 150)",
  amber: "oklch(0.70 0.15 65)",
} as const;

const SEASON_STARTS: Record<string, number> = {
  Spring: 79,
  Summer: 171,
  Autumn: 265,
  Winter: 355,
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTH_STARTS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

function polar(r: number, dayOfYear: number): [number, number] {
  const angle = (dayOfYear / 365) * Math.PI * 2 - Math.PI / 2;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
}

function dayOfYearFromISO(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const start = new Date(y, 0, 0).getTime();
  const date = new Date(y, m - 1, d).getTime();
  return Math.floor((date - start) / 86400000);
}

function currentYear(): number {
  return new Date().getFullYear();
}

function todayDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0).getTime();
  return Math.floor((now.getTime() - start) / 86400000);
}

interface Props {
  allLogs: readonly FoodItem[];
  bodyMeasurements: readonly BodyMeasurement[];
  unlockedAchievements: readonly UserAchievement[];
  calorieGoal: number;
}

export const PhenologyWheel: FC<Props> = ({
  allLogs,
  bodyMeasurements,
  unlockedAchievements,
  calorieGoal,
}) => {
  const year = currentYear();
  const todayDoy = todayDayOfYear();

  const dailyCalories = useMemo(() => {
    const yearPrefix = `${year}-`;
    const map = new Map<number, number>();
    for (const log of allLogs) {
      if (!log.dateLogged.startsWith(yearPrefix)) continue;
      const doy = dayOfYearFromISO(log.dateLogged);
      map.set(doy, (map.get(doy) ?? 0) + log.calories);
    }
    return map;
  }, [allLogs, year]);

  const weightPoints = useMemo(() => {
    const yearPrefix = `${year}-`;
    const pts = bodyMeasurements
      .filter((m) => m.measuredAt.startsWith(yearPrefix) && m.weight !== undefined)
      .map((m) => ({ doy: dayOfYearFromISO(m.measuredAt), weight: m.weight as number }))
      .sort((a, b) => a.doy - b.doy);
    return pts;
  }, [bodyMeasurements, year]);

  const weightRange = useMemo(() => {
    if (weightPoints.length < 2) return null;
    const weights = weightPoints.map((p) => p.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const pad = (max - min) * 0.15 || 2;
    return { min: min - pad, max: max + pad };
  }, [weightPoints]);

  const achievementStamps = useMemo(() => {
    const yearPrefix = `${year}-`;
    return unlockedAchievements
      .filter((ua) => ua.unlockedAt.startsWith(yearPrefix))
      .map((ua) => {
        const def = ACHIEVEMENTS.find((a) => a.id === ua.achievementId);
        return {
          doy: dayOfYearFromISO(ua.unlockedAt.slice(0, 10)),
          icon: def?.icon ?? "★",
          label: def?.title ?? ua.achievementId,
        };
      });
  }, [unlockedAchievements, year]);

  const weightPath = useMemo(() => {
    if (!weightRange || weightPoints.length < 2) return null;
    const { min, max } = weightRange;
    const toR = (w: number) =>
      R.weightMin + ((w - min) / (max - min)) * (R.weightMax - R.weightMin);

    const pts = weightPoints.map((p) => {
      const r = toR(p.weight);
      const [x, y] = polar(r, p.doy);
      return { x, y };
    });

    const d = pts
      .map((pt, i) => {
        if (i === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
        const prev = pts[i - 1]!;
        const cpx = (prev.x + pt.x) / 2;
        const cpy = (prev.y + pt.y) / 2;
        return `Q ${cpx.toFixed(1)} ${cpy.toFixed(1)} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      })
      .join(" ");

    return d;
  }, [weightPoints, weightRange]);

  const tolerance = calorieGoal * 0.1;

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink-soft/50">
        Phenological Record - {year}
      </p>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        role="img"
        aria-label={`Phenology wheel for ${year}: radial year chart showing weight trend and calorie adherence`}
        className="max-w-full"
      >
        {/* Background */}
        <circle cx={CX} cy={CY} r={R.outer} fill={C.paper} stroke={C.rule} strokeWidth={0.5} />

        {/* Season spoke hairlines */}
        {Object.entries(SEASON_STARTS).map(([season, doy]) => {
          const [x1, y1] = polar(R.inner, doy);
          const [x2, y2] = polar(R.outer, doy);
          return (
            <line
              key={season}
              x1={x1.toFixed(1)}
              y1={y1.toFixed(1)}
              x2={x2.toFixed(1)}
              y2={y2.toFixed(1)}
              stroke={C.rule}
              strokeWidth={0.6}
              strokeDasharray="2 3"
            />
          );
        })}

        {/* 365 calibration ticks */}
        {Array.from({ length: 365 }, (_, doy) => {
          const isMonthStart = MONTH_STARTS.includes(doy);
          const isQuarter = doy % 91 === 0;
          const innerR = isQuarter ? R.tick - 8 : isMonthStart ? R.tick - 5 : R.tick - 2;
          const [x1, y1] = polar(R.outer, doy);
          const [x2, y2] = polar(innerR, doy);
          return (
            <line
              key={doy}
              x1={x1.toFixed(1)}
              y1={y1.toFixed(1)}
              x2={x2.toFixed(1)}
              y2={y2.toFixed(1)}
              stroke={isMonthStart ? C.inkSoft : C.rule}
              strokeWidth={isMonthStart ? 0.8 : 0.4}
            />
          );
        })}

        {/* Month labels */}
        {MONTH_STARTS.map((doy, i) => {
          const angle = (doy / 365) * Math.PI * 2 - Math.PI / 2;
          const labelR = R.month - 10;
          const x = CX + labelR * Math.cos(angle);
          const y = CY + labelR * Math.sin(angle);
          const rotation = (doy / 365) * 360 - 90;
          return (
            <text
              key={i}
              x={x.toFixed(1)}
              y={y.toFixed(1)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={7}
              fontFamily="JetBrains Mono, monospace"
              fill={C.inkSoft}
              letterSpacing={0.5}
              transform={`rotate(${rotation}, ${x.toFixed(1)}, ${y.toFixed(1)})`}
            >
              {MONTH_NAMES[i]}
            </text>
          );
        })}

        {/* Intake adherence stipple - persimmon dots where on target, faint dots otherwise */}
        {Array.from({ length: todayDoy }, (_, i) => {
          const doy = i + 1;
          const kcal = dailyCalories.get(doy) ?? 0;
          if (kcal === 0) return null;
          const onTarget = kcal >= calorieGoal - tolerance && kcal <= calorieGoal + tolerance;
          const [x, y] = polar(R.adherence, doy);
          return (
            <circle
              key={doy}
              cx={x.toFixed(1)}
              cy={y.toFixed(1)}
              r={2}
              fill={onTarget ? C.persimmon : C.persimmonFaint}
              opacity={onTarget ? 0.85 : 0.5}
            />
          );
        })}

        {/* Adherence ring guide */}
        <circle
          cx={CX}
          cy={CY}
          r={R.adherence}
          fill="none"
          stroke={C.rule}
          strokeWidth={0.4}
          strokeDasharray="1 4"
        />

        {/* Weight spline */}
        {weightPath && (
          <path
            d={weightPath}
            fill="none"
            stroke={C.sage}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.9}
          />
        )}

        {/* Weight measurement dots */}
        {weightRange &&
          weightPoints.map((pt) => {
            const r =
              R.weightMin +
              ((pt.weight - weightRange.min) / (weightRange.max - weightRange.min)) *
                (R.weightMax - R.weightMin);
            const [x, y] = polar(r, pt.doy);
            return (
              <circle
                key={pt.doy}
                cx={x.toFixed(1)}
                cy={y.toFixed(1)}
                r={2.5}
                fill={C.sage}
                stroke={C.paper}
                strokeWidth={1}
              />
            );
          })}

        {/* Achievement stamps */}
        {achievementStamps.map((stamp) => {
          const [x, y] = polar(R.outer - 14, stamp.doy);
          return (
            <text
              key={stamp.doy}
              x={x.toFixed(1)}
              y={y.toFixed(1)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              aria-label={stamp.label}
            >
              {stamp.icon}
            </text>
          );
        })}

        {/* Today spoke */}
        {(() => {
          const [x1, y1] = polar(R.center, todayDoy);
          const [x2, y2] = polar(R.outer, todayDoy);
          return (
            <line
              x1={x1.toFixed(1)}
              y1={y1.toFixed(1)}
              x2={x2.toFixed(1)}
              y2={y2.toFixed(1)}
              stroke={C.persimmon}
              strokeWidth={1}
              opacity={0.7}
            />
          );
        })()}

        {/* Today dot on outer ring */}
        {(() => {
          const [x, y] = polar(R.outer - 6, todayDoy);
          return <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={3} fill={C.persimmon} />;
        })()}

        {/* Center */}
        <circle cx={CX} cy={CY} r={R.center} fill={C.paper} stroke={C.rule} strokeWidth={0.8} />
        <text
          x={CX}
          y={CY - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={8}
          fontFamily="JetBrains Mono, monospace"
          fill={C.inkSoft}
          letterSpacing={0.3}
        >
          {year}
        </text>
        <text
          x={CX}
          y={CY + 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={7}
          fontFamily="JetBrains Mono, monospace"
          fill={C.rule}
          letterSpacing={0.2}
        >
          {String(todayDoy).padStart(3, "0")}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-5">
        <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-ink-soft/60">
          <span className="inline-block size-2 rounded-full bg-persimmon" aria-hidden="true" />
          On target
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-ink-soft/60">
          <span
            className="inline-block h-0.5 w-4 rounded-full"
            style={{ backgroundColor: C.sage }}
            aria-hidden="true"
          />
          Weight
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-ink-soft/60">
          <span className="inline-block size-2 rounded-full bg-persimmon/30" aria-hidden="true" />
          Today
        </span>
      </div>
    </div>
  );
};
