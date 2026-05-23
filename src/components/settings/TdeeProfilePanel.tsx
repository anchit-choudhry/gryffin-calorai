import { useState } from "react";
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
import {
  ACTIVITY_LEVEL_DESCRIPTIONS,
  ACTIVITY_LEVEL_LABELS,
  ACTIVITY_LEVELS,
  type ActivityLevel,
  cmToIn,
  GOAL_DESCRIPTIONS,
  GOAL_LABELS,
  type GoalType,
  inToCm,
  kgToLb,
  lbToKg,
} from "@/types";
import { computeCalorieGoal, computeTDEE, mifflinStJeorBMR } from "../../lib/tdee";
import { useOnboarding } from "../../hooks/useOnboarding";
import { useAppState } from "../../state/AppState";

const GOAL_TYPES: GoalType[] = ["lose", "maintain", "gain"];

const TdeeProfilePanel = () => {
  const { tdeeProfile } = useAppState();
  const { form, weightUnit, lengthUnit, setWeightUnit, setLengthUnit, isLoading, submit } =
    useOnboarding(() => toast.success("Profile updated"));
  const [touchedHeight, setTouchedHeight] = useState(false);
  const [touchedWeight, setTouchedWeight] = useState(false);

  const values = form.watch();
  const heightCm =
    lengthUnit === "in" ? inToCm(values.heightDisplay || 0) : values.heightDisplay || 0;
  const weightKg =
    weightUnit === "lb" ? lbToKg(values.weightDisplay || 0) : values.weightDisplay || 0;
  const bmr =
    values.age && values.sex && heightCm && weightKg
      ? mifflinStJeorBMR(values.sex, weightKg, heightCm, values.age)
      : 0;
  const tdee = bmr && values.activityLevel ? computeTDEE(bmr, values.activityLevel) : 0;
  const goalKcal = tdee && values.goal ? computeCalorieGoal(tdee, values.goal) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await form.trigger();
    if (ok) await submit();
  };

  return (
    <div className="space-y-6">
      {tdeeProfile && (
        <div className="border border-rule divide-y divide-rule mb-6">
          {[
            { label: "Daily Calorie Goal", value: `${tdeeProfile.weightKg.toFixed(1)} kg profile` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between px-4 py-3">
              <span className="font-sans text-sm text-ink-soft">{label}</span>
              <span className="font-mono text-sm text-ink-soft">{value}</span>
            </div>
          ))}
        </div>
      )}

      <Form {...form}>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Body basics */}
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-wider text-ink-soft mb-3">
              Body Basics
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                      Age
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={13}
                        max={120}
                        placeholder={tdeeProfile ? String(tdeeProfile.age ?? "") : "30"}
                        className={cn(EDITORIAL_INPUT_CLS)}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                      Sex
                    </FormLabel>
                    <div className="flex gap-2 mt-1">
                      {(["male", "female"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => field.onChange(s)}
                          className={cn(
                            "flex-1 border py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors",
                            field.value === s
                              ? "border-ink bg-ink text-paper"
                              : "border-rule text-ink-soft hover:border-ink",
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="heightDisplay"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                        Height
                      </FormLabel>
                      <div className="flex gap-1">
                        {(["cm", "in"] as const).map((u) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => {
                              if (touchedHeight && field.value) {
                                const converted =
                                  u === "in"
                                    ? cmToIn(
                                        lengthUnit === "in" ? inToCm(field.value) : field.value,
                                      )
                                    : inToCm(
                                        lengthUnit === "cm" ? cmToIn(field.value) : field.value,
                                      );
                                field.onChange(Math.round(converted * 10) / 10);
                              }
                              setLengthUnit(u);
                            }}
                            className={cn(
                              "font-mono text-[9px] px-1.5 py-0.5 border transition-colors",
                              lengthUnit === u
                                ? "border-ink text-ink"
                                : "border-rule text-ink-soft",
                            )}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                    <FormControl>
                      <Input
                        type="number"
                        min={lengthUnit === "cm" ? 50 : 20}
                        max={lengthUnit === "cm" ? 272 : 108}
                        step={0.1}
                        placeholder={lengthUnit === "cm" ? "170" : "67"}
                        className={cn(EDITORIAL_INPUT_CLS)}
                        {...field}
                        onChange={(e) => {
                          setTouchedHeight(true);
                          field.onChange(parseFloat(e.target.value) || undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weightDisplay"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                        Weight
                      </FormLabel>
                      <div className="flex gap-1">
                        {(["kg", "lb"] as const).map((u) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => {
                              if (touchedWeight && field.value) {
                                const converted =
                                  u === "lb"
                                    ? kgToLb(
                                        weightUnit === "lb" ? lbToKg(field.value) : field.value,
                                      )
                                    : lbToKg(
                                        weightUnit === "kg" ? kgToLb(field.value) : field.value,
                                      );
                                field.onChange(Math.round(converted * 10) / 10);
                              }
                              setWeightUnit(u);
                            }}
                            className={cn(
                              "font-mono text-[9px] px-1.5 py-0.5 border transition-colors",
                              weightUnit === u
                                ? "border-ink text-ink"
                                : "border-rule text-ink-soft",
                            )}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                    <FormControl>
                      <Input
                        type="number"
                        min={weightUnit === "kg" ? 20 : 44}
                        max={weightUnit === "kg" ? 500 : 1100}
                        step={0.1}
                        placeholder={weightUnit === "kg" ? "70" : "154"}
                        className={cn(EDITORIAL_INPUT_CLS)}
                        {...field}
                        onChange={(e) => {
                          setTouchedWeight(true);
                          field.onChange(parseFloat(e.target.value) || undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Activity level */}
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-wider text-ink-soft mb-3">
              Activity Level
            </h4>
            <FormField
              control={form.control}
              name="activityLevel"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-2">
                    {ACTIVITY_LEVELS.map((level: ActivityLevel) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => field.onChange(level)}
                        className={cn(
                          "w-full text-left border px-4 py-3 transition-colors",
                          field.value === level
                            ? "border-ink bg-ink text-paper"
                            : "border-rule hover:border-ink-soft",
                        )}
                      >
                        <div className="font-sans text-sm font-semibold">
                          {ACTIVITY_LEVEL_LABELS[level]}
                        </div>
                        <div
                          className={cn(
                            "font-sans text-xs mt-0.5",
                            field.value === level ? "text-paper/70" : "text-ink-soft",
                          )}
                        >
                          {ACTIVITY_LEVEL_DESCRIPTIONS[level]}
                        </div>
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Goal */}
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-wider text-ink-soft mb-3">
              Goal
            </h4>
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-2">
                    {GOAL_TYPES.map((g: GoalType) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => field.onChange(g)}
                        className={cn(
                          "w-full text-left border px-4 py-3 transition-colors",
                          field.value === g
                            ? "border-ink bg-ink text-paper"
                            : "border-rule hover:border-ink-soft",
                        )}
                      >
                        <div className="font-sans text-sm font-semibold">{GOAL_LABELS[g]}</div>
                        <div
                          className={cn(
                            "font-sans text-xs mt-0.5",
                            field.value === g ? "text-paper/70" : "text-ink-soft",
                          )}
                        >
                          {GOAL_DESCRIPTIONS[g]}
                        </div>
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Live preview */}
          {goalKcal > 0 && (
            <div className="border border-rule divide-y divide-rule">
              {[
                { label: "BMR", value: `${Math.round(bmr).toLocaleString()} kcal/day` },
                { label: "TDEE", value: `${Math.round(tdee).toLocaleString()} kcal/day` },
                { label: "Daily Goal", value: `${Math.round(goalKcal).toLocaleString()} kcal/day` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between px-4 py-3">
                  <span className="font-sans text-sm text-ink-soft">{label}</span>
                  <span className="font-mono text-sm font-semibold text-persimmon">{value}</span>
                </div>
              ))}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="bg-persimmon text-paper font-mono text-[10px] uppercase tracking-wider rounded-none h-auto px-6 py-2 hover:bg-persimmon/90"
          >
            {isLoading ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default TdeeProfilePanel;
