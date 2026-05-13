import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAppState } from "../state/AppState";
import { type StepFormValues, StepSchema } from "../forms/schemas";

export function useStepForm(): {
  form: ReturnType<typeof useForm<StepFormValues>>;
  isLoading: boolean;
  submitStepLog: (stepsOverride?: number) => Promise<boolean>;
} {
  const { addStepLog } = useAppState();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<StepFormValues>({
    resolver: zodResolver(StepSchema),
    defaultValues: { steps: 1000 },
  });

  const submitStepLog = async (stepsOverride?: number): Promise<boolean> => {
    if (stepsOverride !== undefined) {
      const result = StepSchema.safeParse({ steps: stepsOverride });
      if (!result.success) {
        toast.error(result.error.errors[0]!.message);
        return false;
      }

      setIsLoading(true);
      try {
        await addStepLog(stepsOverride);
        toast.success(`Logged ${stepsOverride.toLocaleString()} steps!`);
        return true;
      } catch {
        toast.error("Failed to log steps. Please try again.");
        return false;
      } finally {
        setIsLoading(false);
      }
    }

    return new Promise<boolean>((resolve) => {
      form.handleSubmit(
        async (data) => {
          setIsLoading(true);
          try {
            await addStepLog(data.steps);
            toast.success(`Logged ${data.steps.toLocaleString()} steps!`);
            form.reset();
            resolve(true);
          } catch {
            toast.error("Failed to log steps. Please try again.");
            resolve(false);
          } finally {
            setIsLoading(false);
          }
        },
        () => resolve(false),
      )();
    });
  };

  return { form, isLoading, submitStepLog };
}
