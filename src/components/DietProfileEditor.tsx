import type { FC } from "react";
import { useEffect } from "react";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DIET_PRESETS, RESTRICTION_FLAGS } from "@/types";
import type { DietPreset, RestrictionFlag } from "@/types";
import { useDietProfile } from "@/hooks/useDietProfile";
import { useAppState } from "@/state/AppState";

const DietProfileEditor: FC = () => {
  const { form, onSubmit } = useDietProfile();
  const { dietProfile } = useAppState();

  useEffect(() => {
    if (dietProfile) {
      form.reset({
        preset: dietProfile.preset,
        restrictions: dietProfile.restrictions,
      });
    }
  }, [dietProfile, form]);

  const selectedPreset = form.watch("preset") as DietPreset;
  const selectedRestrictions = form.watch("restrictions") as RestrictionFlag[];
  const macros = DIET_PRESETS[selectedPreset]?.macros;

  const toggleRestriction = (flag: RestrictionFlag) => {
    const current = selectedRestrictions ?? [];
    form.setValue(
      "restrictions",
      current.includes(flag) ? current.filter((r) => r !== flag) : [...current, flag],
      { shouldDirty: true },
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-8" data-tour-id="diet-profile-editor">
        {/* Preset selector */}
        <FormField
          control={form.control}
          name="preset"
          render={() => (
            <FormItem>
              <FormLabel className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                Diet Preset
              </FormLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {(Object.keys(DIET_PRESETS) as DietPreset[]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => form.setValue("preset", preset, { shouldDirty: true })}
                    className={cn(
                      "border px-3 py-2 text-xs font-mono text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1",
                      selectedPreset === preset
                        ? "border-ink bg-ink text-paper"
                        : "border-rule text-ink-soft hover:border-ink hover:text-ink",
                    )}
                  >
                    {DIET_PRESETS[preset].label}
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Macro targets (read-only, derived from preset) */}
        {macros && (
          <div className="border border-rule p-4 space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-3">
              Macro Targets
            </p>
            <div className="flex gap-6">
              {(["protein", "carbs", "fat"] as const).map((macro) => (
                <div key={macro} className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
                    {macro}
                  </span>
                  <span className="font-mono text-lg tabular-nums text-ink">{macros[macro]}%</span>
                  <div className="h-1 w-12 bg-rule rounded-full overflow-hidden">
                    <div
                      className="h-full bg-persimmon rounded-full"
                      style={{ width: `${macros[macro]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Restriction flags */}
        <FormField
          control={form.control}
          name="restrictions"
          render={() => (
            <FormItem>
              <FormLabel className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                Dietary Restrictions
              </FormLabel>
              <p className="text-xs text-ink-soft mt-1 mb-3">
                A warning toast will appear when logging foods that may contain these ingredients.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(RESTRICTION_FLAGS) as RestrictionFlag[]).map((flag) => {
                  const active = selectedRestrictions?.includes(flag) ?? false;
                  return (
                    <button
                      key={flag}
                      type="button"
                      onClick={() => toggleRestriction(flag)}
                      className={cn(
                        "border px-3 py-2 text-xs font-mono text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1",
                        active
                          ? "border-persimmon bg-persimmon/10 text-ink"
                          : "border-rule text-ink-soft hover:border-ink hover:text-ink",
                      )}
                    >
                      {active && <span className="mr-1">x</span>}
                      {RESTRICTION_FLAGS[flag].label}
                    </button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting || !form.formState.isDirty}
          className="font-mono text-xs uppercase tracking-widest rounded-none"
        >
          {form.formState.isSubmitting ? "Saving..." : "Save Diet Profile"}
        </Button>
      </form>
    </Form>
  );
};

export default DietProfileEditor;
