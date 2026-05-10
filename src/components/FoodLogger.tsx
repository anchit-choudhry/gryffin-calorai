// src/components/FoodLogger.tsx
import { type FC, type FormEvent, useEffect } from "react";
import type { FoodItem } from "../db/dbService";
import { useFoodForm } from "../hooks/useFoodForm";
import { MEAL_TYPES } from "../types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface FoodLoggerProps {
  initialFood?: FoodItem;
  onCancel?: () => void;
  onSuccess?: () => void;
  prefillName?: string;
}

const inputCls =
  "w-full border-b border-rule bg-transparent font-mono text-sm text-ink focus:outline-none focus:border-persimmon pb-1 pt-1 placeholder:text-ink-soft/50 transition-colors";

const labelCls = "font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft";

const FoodLogger: FC<FoodLoggerProps> = ({ initialFood, onCancel, onSuccess, prefillName }) => {
  const { form, isLoading, isEditMode, submitFoodLog, resetForm } = useFoodForm(initialFood);

  useEffect(() => {
    if (prefillName && !initialFood) {
      form.setValue("name", prefillName);
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

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Food Name</FormLabel>
              <FormControl>
                <input {...field} type="text" className={inputCls} placeholder="e.g., Apple" />
              </FormControl>
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
                <div className="flex gap-1.5 flex-wrap mt-1">
                  {MEAL_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => field.onChange(type)}
                      className={`px-3 py-1 border font-mono text-[10px] uppercase tracking-wider transition-colors ${
                        field.value === type
                          ? "border-ink bg-ink text-paper"
                          : "border-rule text-ink-soft hover:border-ink hover:text-ink"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage className="font-mono text-[10px]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="calories"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Calories per Serving</FormLabel>
              <FormControl>
                <input
                  {...field}
                  type="number"
                  className={inputCls}
                  placeholder="e.g., 95"
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                <input
                  {...field}
                  type="number"
                  className={inputCls}
                  placeholder="e.g., 1"
                  min="1"
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormMessage className="font-mono text-[10px]" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="protein"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Protein (g)</FormLabel>
                <FormControl>
                  <input
                    {...field}
                    type="number"
                    className={inputCls}
                    placeholder="0"
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage className="font-mono text-[10px]" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="carbs"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Carbs (g)</FormLabel>
                <FormControl>
                  <input
                    {...field}
                    type="number"
                    className={inputCls}
                    placeholder="0"
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage className="font-mono text-[10px]" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fat"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Fat (g)</FormLabel>
                <FormControl>
                  <input
                    {...field}
                    type="number"
                    className={inputCls}
                    placeholder="0"
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage className="font-mono text-[10px]" />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-2.5 bg-persimmon text-paper font-mono text-[10px] uppercase tracking-[0.2em] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? "Saving..." : isEditMode ? "Update Food" : "Log Food"}
          </button>
          {isEditMode && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 py-2.5 border border-rule font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </Form>
  );
};

export default FoodLogger;
