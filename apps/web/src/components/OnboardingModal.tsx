import { useState } from "react";
import { HardDrive, Lock, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { useOnboarding } from "../hooks/useOnboarding";
import { computeCalorieGoal, computeTDEE, mifflinStJeorBMR } from "../lib/tdee";

interface Props {
  open: boolean;
  onClose: () => void;
}

const GOAL_TYPES: GoalType[] = ["lose", "maintain", "gain"];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-0.5 flex-1 transition-colors duration-300",
            i <= current ? "bg-persimmon" : "bg-rule",
          )}
        />
      ))}
    </div>
  );
}

const OnboardingModal = ({ open, onClose }: Props) => {
  const {
    step,
    totalSteps,
    form,
    weightUnit,
    lengthUnit,
    setWeightUnit,
    setLengthUnit,
    isLoading,
    nextStep,
    prevStep,
    submit,
  } = useOnboarding(onClose);

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

  const [touchedHeight, setTouchedHeight] = useState(false);
  const [touchedWeight, setTouchedWeight] = useState(false);

  const handleNextStep1 = async () => {
    const ok = await form.trigger(["age", "sex", "heightDisplay", "weightDisplay"]);
    if (ok) nextStep();
  };

  const handleNextStep2 = async () => {
    const ok = await form.trigger(["activityLevel"]);
    if (ok) nextStep();
  };

  const handleNextStep3 = async () => {
    const ok = await form.trigger(["goal"]);
    if (ok) nextStep();
  };

  const getNextHandler = () => {
    if (step === 1) return handleNextStep1;
    if (step === 2) return handleNextStep2;
    return handleNextStep3;
  };

  const renderForwardButton = () => {
    if (step === 0) {
      return (
        <Button
          type="button"
          onClick={nextStep}
          className="bg-ink text-paper font-mono text-[10px] uppercase tracking-wider rounded-none h-auto px-6 py-2 hover:bg-ink/90"
        >
          Get started
        </Button>
      );
    }
    if (step < totalSteps - 1) {
      return (
        <Button
          type="button"
          onClick={getNextHandler()}
          className="bg-ink text-paper font-mono text-[10px] uppercase tracking-wider rounded-none h-auto px-6 py-2 hover:bg-ink/90"
        >
          Continue
        </Button>
      );
    }
    return (
      <Button
        type="button"
        onClick={submit}
        disabled={isLoading}
        className="bg-persimmon text-paper font-mono text-[10px] uppercase tracking-wider rounded-none h-auto px-6 py-2 hover:bg-persimmon/90"
      >
        {isLoading ? "Saving..." : "Save goals"}
      </Button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl rounded-none border border-rule bg-paper">
        <DialogHeader>
          <DialogTitle className="font-sans text-xl font-semibold text-ink">
            Set up your goals
          </DialogTitle>
        </DialogHeader>

        <StepIndicator current={step} total={totalSteps} />

        <Form {...form}>
          <form className="space-y-5">
            {/* Step 0: Welcome - privacy-forward */}
            {step === 0 && (
              <div className="space-y-5">
                <ul className="space-y-3">
                  {(
                    [
                      {
                        Icon: HardDrive,
                        text: "Offline-first - data lives on your device, never uploaded without consent.",
                      },
                      { Icon: User, text: "No account required - start logging right away." },
                      {
                        Icon: Lock,
                        text: "Private by design - export or wipe at any time.",
                      },
                    ] as const
                  ).map(({ Icon, text }) => (
                    <li key={text} className="flex items-start gap-3">
                      <Icon className="mt-0.5 size-4 shrink-0 text-persimmon" aria-hidden="true" />
                      <span className="font-sans text-sm text-ink">{text}</span>
                    </li>
                  ))}
                </ul>
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink-soft/60 pt-1">
                  Two minutes to calibrate
                </p>
              </div>
            )}

            {/* Step 1: Body basics */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="font-sans text-sm text-ink-soft">
                  Enter your measurements to calibrate your metabolic baseline.
                </p>

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
                            placeholder="30"
                            className={cn(EDITORIAL_INPUT_CLS)}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value, 10) || undefined)
                            }
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
                </div>

                <div className="grid grid-cols-2 gap-4">
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
            )}

            {/* Step 2: Activity level */}
            {step === 2 && (
              <div className="space-y-3">
                <p className="font-sans text-sm text-ink-soft">
                  How active are you on a typical week?
                </p>
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
            )}

            {/* Step 3: Goal */}
            {step === 3 && (
              <div className="space-y-3">
                <p className="font-sans text-sm text-ink-soft">What is your primary goal?</p>
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
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-4">
                <p className="font-sans text-sm text-ink-soft">
                  Your calibrated daily target, derived from the Mifflin-St Jeor formula.
                </p>
                <div className="border border-rule divide-y divide-rule">
                  {[
                    {
                      label: "Basal Metabolic Rate",
                      value: bmr ? `${bmr.toLocaleString()} kcal/day` : "-",
                    },
                    {
                      label: "Total Daily Energy Expenditure",
                      value: tdee ? `${tdee.toLocaleString()} kcal/day` : "-",
                    },
                    {
                      label: "Daily Calorie Goal",
                      value: goalKcal ? `${goalKcal.toLocaleString()} kcal/day` : "-",
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between px-4 py-3">
                      <span className="font-sans text-sm text-ink-soft">{label}</span>
                      <span className="font-mono text-sm font-semibold text-persimmon">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="font-sans text-xs text-ink-soft/60">
                  You can update these at any time in Settings.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-2 border-t border-rule">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  className="font-mono text-[10px] uppercase tracking-wider text-ink-soft hover:text-ink rounded-none h-auto p-0"
                >
                  Back
                </Button>
              ) : (
                <div />
              )}
              {renderForwardButton()}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
