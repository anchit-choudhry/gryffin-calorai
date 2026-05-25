import { Flame } from "lucide-react";
import { useAppState } from "../state/AppState";

const ActivityTracker = () => {
  const { dailyActivityLogs } = useAppState();

  const totalBurned = dailyActivityLogs.reduce((sum, l) => sum + l.caloriesBurned, 0);

  return (
    <div>
      <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-soft mb-3">
        Activity
      </h3>

      <div className="flex items-center gap-2 mb-3">
        <Flame className="size-4 text-persimmon" />
        <span className="font-display text-2xl tabular-nums text-ink">
          {totalBurned.toLocaleString()}
        </span>
        <span className="font-sans text-xs text-ink-soft">kcal burned</span>
      </div>

      {dailyActivityLogs.length === 0 ? (
        <p className="font-mono text-[10px] text-ink-soft/60 truncate">No activities today.</p>
      ) : (
        <ul className="space-y-1 max-h-40 overflow-y-auto divide-y divide-rule">
          {[...dailyActivityLogs].reverse().map((log) => (
            <li
              key={log.id}
              className="flex justify-between items-center py-1 font-mono text-[11px] text-ink-soft"
            >
              <span className="truncate mr-2">{log.activityType}</span>
              <span className="shrink-0 text-[10px]">{log.caloriesBurned} kcal</span>
            </li>
          ))}
        </ul>
      )}

      <a
        href="#dashboard"
        className="mt-3 block font-mono text-[10px] uppercase tracking-wider text-persimmon hover:text-persimmon/80 transition-colors"
        onClick={(e) => {
          e.preventDefault();
          document
            .querySelector('[data-tour-id="dashboard-activity"]')
            ?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        Log activity
      </a>
    </div>
  );
};

export default ActivityTracker;
