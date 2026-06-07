// src/components/FoodLogger.tsx
import { type FC, type FormEvent, type MutableRefObject, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { FoodItem } from "../db/dbService";
import { useFoodForm } from "../hooks/useFoodForm";
import { useRecentFoods } from "../hooks/useRecentFoods";
import { FoodSearchCombobox } from "./FoodSearchCombobox";
import {
  MEAL_TYPES,
  MICRONUTRIENT_LABELS,
  MICRONUTRIENT_RDA,
  MICRONUTRIENT_UNITS,
  type NutritionKey,
} from "@/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, EDITORIAL_INPUT_CLS, LABEL_MONO_CLS } from "../lib/utils";
import { ChevronDown } from "lucide-react";

interface FoodLoggerProps {
  initialFood?: FoodItem;
  onCancel?: () => void;
  onSuccess?: () => void;
  prefillName?: string;
}

type NutritionPath = `nutritionData.${NutritionKey}`;

const MICRONUTRIENT_GROUPS: { label: string; keys: NutritionKey[] }[] = [
  {
    label: "Vitamins",
    keys: [
      "vitaminA",
      "vitaminB12",
      "vitaminB6",
      "vitaminC",
      "vitaminD",
      "vitaminE",
      "vitaminK",
      "folate",
      "niacin",
      "thiamine",
    ],
  },
  {
    label: "Minerals",
    keys: [
      "calcium",
      "iron",
      "magnesium",
      "potassium",
      "sodium",
      "zinc",
      "copper",
      "iodine",
      "phosphorus",
      "selenium",
    ],
  },
  {
    label: "Other Nutrients",
    keys: ["fiber", "sugar", "saturatedFat", "transFat", "cholesterol"],
  },
];

const labelCls = LABEL_MONO_CLS;

const MACRO_FIELDS = [
  { name: "protein" as const, label: "Protein (g)" },
  { name: "carbs" as const, label: "Carbs (g)" },
  { name: "fat" as const, label: "Fat (g)" },
];

function CollapsibleToggle({
  label,
  open,
  onClick,
}: {
  label: string;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="flex h-auto w-full items-center justify-between rounded-none border-rule py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft"
    >
      {label}
      <ChevronDown
        className={cn("h-3 w-3 transition-transform duration-200", open && "rotate-180")}
        aria-hidden="true"
      />
    </Button>
  );
}

const FoodLogger: FC<FoodLoggerProps> = ({ initialFood, onCancel, onSuccess, prefillName }) => {
  const { form, isLoading, isEditMode, submitFoodLog, resetForm, prefillFromFood } =
    useFoodForm(initialFood);
  const recentFoods = useRecentFoods();
  const [showMacros, setShowMacros] = useState(
    () => !!initialFood && (initialFood.protein !== undefined || initialFood.carbs !== undefined),
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const nameValue = form.watch("name");

  useEffect(() => {
    if (prefillName && !initialFood) {
      const safe = prefillName
        .replace(/[^\w\s\-',.()/]/g, "")
        .slice(0, 100)
        .trim();
      if (safe) form.setValue("name", safe);
    }
  }, [prefillName, initialFood, form]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const success = await submitFoodLog();
    if (success) onSuccess?.();
  };

  const handleCancel = () => {
    resetForm();
    onCancel?.();
  };

  const handleComboboxSelect = (food: FoodItem) => {
    prefillFromFood(food);
    setShowMacros(food.protein !== undefined || food.carbs !== undefined || food.fat !== undefined);
    nameInputRef.current?.focus();
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name with food search combobox */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="relative">
              <FormLabel className={labelCls}>Food Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  ref={(el) => {
                    field.ref(el);
                    (nameInputRef as MutableRefObject<HTMLInputElement | null>).current = el;
                  }}
                  type="text"
                  className={EDITORIAL_INPUT_CLS}
                  placeholder="e.g., Apple"
                  autoComplete="off"
                />
              </FormControl>
              <FoodSearchCombobox
                query={nameValue}
                corpus={recentFoods}
                onSelect={handleComboboxSelect}
                inputRef={nameInputRef}
              />
              <FormMessage className="font-mono text-[10px]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mealType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Meal Type</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {MEAL_TYPES.map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={field.value === type ? "default" : "outline"}
                      className="h-auto rounded-none px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider"
                      onClick={() => field.onChange(type)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </FormControl>
              <FormMessage className="font-mono text-[10px]" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="calories"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Calories / serving</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    className={EDITORIAL_INPUT_CLS}
                    placeholder="e.g., 95"
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  />
                </FormControl>
                <FormMessage className="font-mono text-[10px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="servingSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Serving Size</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    className={EDITORIAL_INPUT_CLS}
                    placeholder="e.g., 1"
                    min="1"
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                  />
                </FormControl>
                <FormMessage className="font-mono text-[10px]" />
              </FormItem>
            )}
          />
        </div>

        {/* Macros - collapsed by default (progressive disclosure) */}
        <div>
          <CollapsibleToggle
            label="Macros"
            open={showMacros}
            onClick={() => setShowMacros(!showMacros)}
          />

          <AnimatePresence initial={false}>
            {showMacros && (
              <motion.div
                key="macros"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-3 grid grid-cols-3 gap-4">
                  {MACRO_FIELDS.map(({ name, label }) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelCls}>{label}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              type="number"
                              className={EDITORIAL_INPUT_CLS}
                              placeholder="—"
                              step="any"
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                field.onChange(isNaN(v) ? undefined : v);
                              }}
                            />
                          </FormControl>
                          <FormMessage className="font-mono text-[10px]" />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Advanced Nutrition - micronutrients */}
        <div>
          <CollapsibleToggle
            label="Advanced Nutrition"
            open={showAdvanced}
            onClick={() => setShowAdvanced(!showAdvanced)}
          />

          <AnimatePresence initial={false}>
            {showAdvanced && (
              <motion.div
                key="advanced"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-4">
                  {MICRONUTRIENT_GROUPS.map((group) => (
                    <div key={group.label}>
                      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft/60">
                        {group.label}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {group.keys.map((key) => (
                          <FormField
                            key={key}
                            control={form.control}
                            name={`nutritionData.${key}` as NutritionPath}
                            render={({ field }) => {
                              const val = typeof field.value === "number" ? field.value : undefined;
                              const pct =
                                val != null && val > 0
                                  ? Math.min(100, Math.round((val / MICRONUTRIENT_RDA[key]) * 100))
                                  : null;
                              return (
                                <FormItem>
                                  <FormLabel className={labelCls}>
                                    {MICRONUTRIENT_LABELS[key]}
                                    <span className="ml-1 normal-case font-sans tracking-normal opacity-50">
                                      ({MICRONUTRIENT_UNITS[key]})
                                    </span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      className={EDITORIAL_INPUT_CLS}
                                      step="any"
                                      min="0"
                                      placeholder="—"
                                      value={val ?? ""}
                                      onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        field.onChange(isNaN(v) ? undefined : v);
                                      }}
                                    />
                                  </FormControl>
                                  {pct !== null && (
                                    <p className="mt-0.5 font-mono text-[9px] text-ink-soft/60">
                                      {pct}% DV
                                    </p>
                                  )}
                                  <FormMessage className="font-mono text-[10px]" />
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            type="submit"
            variant="persimmon"
            disabled={isLoading}
            className="flex-1 h-auto rounded-none py-2.5 font-mono text-[10px] uppercase tracking-[0.2em]"
          >
            {isLoading ? "Saving..." : isEditMode ? "Update Food" : "Log Food"}
          </Button>
          {isEditMode && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 h-auto rounded-none border-rule py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};

export default FoodLogger;
