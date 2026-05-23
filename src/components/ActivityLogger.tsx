import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn, EDITORIAL_INPUT_CLS } from "@/lib/utils";
import { computeCaloriesBurned, MET_ACTIVITY_NAMES } from "../lib/metTable";
import { useActivityForm } from "../hooks/useActivityForm";
import { useAppState } from "../state/AppState";

const ActivityLogger = () => {
  const { form, isLoading, submitActivityLog, weightKg, hasProfile } = useActivityForm();
  const { dailyActivityLogs, deleteActivityLog, addActivityLog, userId } = useAppState();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const activityType = form.watch("activityType");
  const durationMin = form.watch("durationMin");
  const preview =
    activityType && durationMin && durationMin >= 1
      ? computeCaloriesBurned(activityType, durationMin, weightKg)
      : null;

  const filtered = query
    ? MET_ACTIVITY_NAMES.filter((n) => n.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
    : MET_ACTIVITY_NAMES.slice(0, 10);

  return (
    <div data-tour-id="dashboard-activity">
      <div className="flex items-center gap-2 mb-4">
        <Dumbbell className="size-4 text-persimmon" />
        <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-soft">
          Log Activity
        </h3>
      </div>

      {!hasProfile && (
        <p className="font-mono text-[10px] text-ink-soft/60 mb-3">
          Complete your profile to get accurate calorie estimates. Using 70 kg default.
        </p>
      )}

      <Form {...form}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submitActivityLog(e);
          }}
        >
          <FormField
            control={form.control}
            name="activityType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                  Activity
                </FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      placeholder="Search activities..."
                      value={field.value || query}
                      className={cn(EDITORIAL_INPUT_CLS)}
                      onFocus={() => setOpen(true)}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        field.onChange("");
                        setOpen(true);
                      }}
                    />
                  </FormControl>
                  {field.value && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-persimmon">
                      {field.value.split(" ")[0]}
                    </span>
                  )}
                  {open && (
                    <ul className="absolute z-50 left-0 right-0 top-full mt-1 border border-rule bg-paper max-h-48 overflow-y-auto divide-y divide-rule">
                      {filtered.length === 0 ? (
                        <li className="px-3 py-2 font-mono text-[10px] text-ink-soft">
                          No activities found
                        </li>
                      ) : (
                        filtered.map((name) => (
                          <li key={name}>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 font-sans text-sm text-ink hover:bg-paper-raised transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                field.onChange(name);
                                setQuery(name);
                                setOpen(false);
                              }}
                            >
                              {name}
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="durationMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                  Duration (minutes)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={1440}
                    placeholder="30"
                    className={cn(EDITORIAL_INPUT_CLS)}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || undefined)}
                    onFocus={() => setOpen(false)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {preview !== null && (
            <p className="font-mono text-[10px] text-ink-soft">
              Est. burn:{" "}
              <span className="text-persimmon font-semibold">{preview.toLocaleString()} kcal</span>
            </p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-ink text-paper font-mono text-[10px] uppercase tracking-wider rounded-none h-auto px-4 py-2 hover:bg-ink/90"
          >
            {isLoading ? "Logging..." : "Log Activity"}
          </Button>
        </form>
      </Form>

      {dailyActivityLogs.length > 0 && (
        <div className="mt-6">
          <h4 className="font-mono text-[10px] uppercase tracking-wider text-ink-soft mb-2">
            Today
          </h4>
          <ul className="space-y-0 divide-y divide-rule max-h-48 overflow-y-auto">
            {[...dailyActivityLogs].reverse().map((log) => (
              <li
                key={log.id}
                className="flex justify-between items-center py-2 font-mono text-[11px] text-ink-soft"
              >
                <div className="flex flex-col min-w-0 mr-2">
                  <span className="truncate text-ink text-xs">{log.activityType}</span>
                  <span className="text-[10px]">{log.durationMin} min</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-persimmon text-xs tabular-nums">
                    {log.caloriesBurned} kcal
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-ink-soft hover:text-persimmon transition-colors p-0"
                    onClick={() => {
                      if (!log.id || !userId) return;
                      const { activityType, durationMin, caloriesBurned, dateLogged, loggedAt } =
                        log;
                      deleteActivityLog(log.id);
                      toast("Activity removed", {
                        action: {
                          label: "Undo",
                          onClick: () =>
                            addActivityLog({
                              userId,
                              activityType,
                              durationMin,
                              caloriesBurned,
                              dateLogged,
                              loggedAt,
                            }),
                        },
                      });
                    }}
                    aria-label={`Remove ${log.activityType} entry`}
                  >
                    ✕
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ActivityLogger;
