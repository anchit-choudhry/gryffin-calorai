// src/components/FoodLogger.tsx
import { type FC, type FormEvent, useEffect } from "react";
import type { FoodItem } from "../db/dbService";
import { useFoodForm } from "../hooks/useFoodForm";
import { MEAL_TYPES } from "@/types";
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
import { EDITORIAL_INPUT_CLS } from "../lib/utils";

interface FoodLoggerProps {
  initialFood?: FoodItem;
  onCancel?: () => void;
  onSuccess?: () => void;
  prefillName?: string;
}

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
                <Input
                  {...field}
                  type="text"
                  className={EDITORIAL_INPUT_CLS}
                  placeholder="e.g., Apple"
                />
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
                    <Button
                      key={type}
                      type="button"
                      variant={field.value === type ? "default" : "outline"}
                      className="font-mono text-[10px] uppercase tracking-wider rounded-none h-auto px-3 py-1.5"
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

        <FormField
          control={form.control}
          name="calories"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Calories per Serving</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  className={EDITORIAL_INPUT_CLS}
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
                <Input
                  {...field}
                  type="number"
                  className={EDITORIAL_INPUT_CLS}
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
                  <Input
                    {...field}
                    type="number"
                    className={EDITORIAL_INPUT_CLS}
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
                  <Input
                    {...field}
                    type="number"
                    className={EDITORIAL_INPUT_CLS}
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
                  <Input
                    {...field}
                    type="number"
                    className={EDITORIAL_INPUT_CLS}
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
          <Button
            type="submit"
            variant="persimmon"
            disabled={isLoading}
            className="flex-1 font-mono text-[10px] uppercase tracking-[0.2em] rounded-none h-auto py-2.5"
          >
            {isLoading ? "Saving..." : isEditMode ? "Update Food" : "Log Food"}
          </Button>
          {isEditMode && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 font-mono text-[10px] uppercase tracking-[0.2em] rounded-none h-auto py-2.5 text-ink-soft border-rule"
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
