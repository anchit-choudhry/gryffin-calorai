import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { useAppState } from "../state/AppState";
import type { BodyMeasurement } from "../db/dbService";
import { type FoodItem, getAllBodyMeasurements, getAllFoodLogs } from "../db/dbService";
import { LABEL_MONO_CLS } from "@/lib/utils";

const MEAL_ORDER = ["Breakfast", "Lunch", "Snacks", "Dinner"] as const;

function getWeekDates(): string[] {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function getMonthBounds(monthsAgo: number): { start: string; end: string; label: string } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const start = d.toISOString().slice(0, 10);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const end = lastDay.toISOString().slice(0, 10);
  const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return { start, end, label };
}

interface MonthSummary {
  label: string;
  daysLogged: number;
  avgCalories: number;
  totalDays: number;
}

function computeMonthSummary(
  logs: FoodItem[],
  monthBound: ReturnType<typeof getMonthBounds>,
): MonthSummary {
  const inRange = logs.filter(
    (l) => l.dateLogged >= monthBound.start && l.dateLogged <= monthBound.end,
  );
  const byDate = new Map<string, number>();
  for (const log of inRange) {
    byDate.set(log.dateLogged, (byDate.get(log.dateLogged) ?? 0) + log.calories);
  }
  const days = [...byDate.values()];
  const avgCalories = days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0;
  return {
    label: monthBound.label,
    daysLogged: byDate.size,
    avgCalories,
    totalDays: new Date(
      new Date(monthBound.end).getFullYear(),
      new Date(monthBound.end).getMonth() + 1,
      0,
    ).getDate(),
  };
}

interface DayEntry {
  date: string;
  label: string;
  meals: Record<string, FoodItem[]>;
  total: number;
}

function buildWeekEntries(logs: FoodItem[], weekDates: string[]): DayEntry[] {
  return weekDates.map((date) => {
    const dayLogs = logs.filter((l) => l.dateLogged === date);
    const meals: Record<string, FoodItem[]> = {};
    for (const log of dayLogs) {
      const mt = log.mealType ?? "Snacks";
      if (!meals[mt]) meals[mt] = [];
      meals[mt].push(log);
    }
    const total = dayLogs.reduce((s, l) => s + l.calories, 0);
    const d = new Date(date + "T00:00:00");
    const label = d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    return { date, label, meals, total };
  });
}

function WeeklyJournalPage({ entries, calorieGoal }: { entries: DayEntry[]; calorieGoal: number }) {
  const now = new Date();
  const weekLabel = `Week of ${new Date(entries[0]!.date + "T00:00:00").toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    },
  )}`;

  return (
    <section className="print-page">
      <header className="print-header">
        <div className="print-brand">Gryffin Calorai</div>
        <div className="print-subtitle">Field Journal - Weekly Record</div>
        <div className="print-meta">
          {weekLabel} - Printed {now.toLocaleDateString()}
        </div>
        <div className="print-rule" />
      </header>

      <table className="print-table">
        <thead>
          <tr>
            <th className="print-th-day">Day</th>
            {MEAL_ORDER.map((m) => (
              <th key={m} className="print-th-meal">
                {m}
              </th>
            ))}
            <th className="print-th-total">Total kcal</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const onTarget = entry.total > 0 && entry.total <= calorieGoal;
            return (
              <tr key={entry.date} className="print-row">
                <td className="print-td-day">{entry.label}</td>
                {MEAL_ORDER.map((meal) => {
                  const items = entry.meals[meal] ?? [];
                  return (
                    <td key={meal} className="print-td-meal">
                      {items.length > 0 ? (
                        <ul className="print-meal-list">
                          {items.map((item, i) => (
                            <li key={i}>
                              {item.name}
                              <span className="print-kcal">{item.calories}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="print-empty">-</span>
                      )}
                    </td>
                  );
                })}
                <td className={`print-td-total ${onTarget ? "print-on-target" : ""}`}>
                  {entry.total > 0 ? entry.total.toLocaleString() : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} className="print-goal-row">
              Calorie goal: {calorieGoal.toLocaleString()} kcal / day
            </td>
            <td />
          </tr>
        </tfoot>
      </table>

      <div className="print-notes-section">
        <p className="print-notes-label">Notes</p>
        <div className="print-notes-lines">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="print-note-line" />
          ))}
        </div>
      </div>
    </section>
  );
}

function AnnualReviewPage({ months }: { months: MonthSummary[] }) {
  const year = new Date().getFullYear();
  return (
    <section className="print-page print-page-break">
      <header className="print-header">
        <div className="print-brand">Gryffin Calorai</div>
        <div className="print-subtitle">Field Journal - Annual Review</div>
        <div className="print-meta">{year} in Review</div>
        <div className="print-rule" />
      </header>

      <div className="print-months-grid">
        {months.map((month) => {
          const pct =
            month.totalDays > 0 ? Math.round((month.daysLogged / month.totalDays) * 100) : 0;
          return (
            <div key={month.label} className="print-month-tile">
              <div className="print-month-label">{month.label}</div>
              <div className="print-month-stat">
                {month.daysLogged}
                <span className="print-month-sub">/{month.totalDays} days</span>
              </div>
              <div className="print-month-kcal">
                {month.avgCalories > 0
                  ? `avg ${month.avgCalories.toLocaleString()} kcal`
                  : "no data"}
              </div>
              <div className="print-month-bar-wrap">
                <div className="print-month-bar" style={{ width: `${pct}%` }} />
              </div>
              <div className="print-month-pct">{pct}%</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function PrintPage() {
  const { userId, init } = useAppState();
  const calorieGoal = init.status === "ready" ? init.user.calorieGoal : 2000;
  const [allLogs, setAllLogs] = useState<FoodItem[]>([]);
  const [_measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    Promise.all([getAllFoodLogs(userId), getAllBodyMeasurements(userId)])
      .then(([logs, measurements]) => {
        setAllLogs(logs);
        setMeasurements(measurements);
      })
      .finally(() => setIsLoading(false));
  }, [userId]);

  const weekDates = useMemo(() => getWeekDates(), []);

  const weekEntries = useMemo(() => buildWeekEntries(allLogs, weekDates), [allLogs, weekDates]);

  const monthSummaries = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const bound = getMonthBounds(i);
        return computeMonthSummary(allLogs, bound);
      }).reverse(),
    [allLogs],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className={LABEL_MONO_CLS}>Preparing print view...</p>
      </div>
    );
  }

  return (
    <div id="print-root">
      {/* Screen-only controls */}
      <div className="no-print flex items-center justify-between border-b border-rule px-6 py-4 sticky top-0 bg-paper z-10">
        <button
          type="button"
          onClick={() => (window.location.hash = "#progress")}
          className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.15em] text-ink-soft hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back
        </button>
        <span className="font-display text-lg text-ink">Print Preview</span>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-persimmon px-4 py-2 font-mono text-xs uppercase tracking-[0.15em] text-paper hover:bg-persimmon/90 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Printer className="size-3.5" aria-hidden="true" />
          Print
        </button>
      </div>

      <div className="print-preview-wrap">
        <WeeklyJournalPage entries={weekEntries} calorieGoal={calorieGoal} />
        <AnnualReviewPage months={monthSummaries} />
      </div>
    </div>
  );
}
