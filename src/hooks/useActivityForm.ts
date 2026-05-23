import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { type ActivityFormValues, ActivitySchema } from "../forms/schemas";
import { useAppState } from "../state/AppState";
import { todayISO } from "@/types";
import { computeCaloriesBurned } from "../lib/metTable";

const DEFAULT_WEIGHT_KG = 70;

export function useActivityForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { addActivityLog, tdeeProfile, userId } = useAppState();

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(ActivitySchema),
    mode: "onBlur",
    defaultValues: {
      activityType: "",
      durationMin: undefined,
    },
  });

  const weightKg = tdeeProfile?.weightKg ?? DEFAULT_WEIGHT_KG;
  const hasProfile = tdeeProfile !== null;

  const handleActivityValues = useCallback(
    async (values: ActivityFormValues) => {
      setIsLoading(true);
      try {
        const caloriesBurned = computeCaloriesBurned(
          values.activityType,
          values.durationMin,
          weightKg,
        );
        await addActivityLog({
          userId: userId!,
          activityType: values.activityType,
          durationMin: values.durationMin,
          caloriesBurned,
          dateLogged: todayISO(),
          loggedAt: new Date().toISOString(),
        });
        toast.success(`Logged ${values.activityType} - ${caloriesBurned} kcal burned`);
        form.reset();
      } catch {
        toast.error("Failed to log activity");
      } finally {
        setIsLoading(false);
      }
    },
    [addActivityLog, userId, weightKg, form],
  );

  const submitActivityLog = form.handleSubmit(handleActivityValues);

  return { form, isLoading, submitActivityLog, weightKg, hasProfile };
}
