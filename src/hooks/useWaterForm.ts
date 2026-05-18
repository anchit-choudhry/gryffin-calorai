import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAppState } from "../state/AppState";
import { type WaterFormValues, WaterSchema } from "../forms/schemas";

export function useWaterForm(): {
  form: ReturnType<typeof useForm<WaterFormValues>>;
  isLoading: boolean;
  submitWaterLog: (amountOverride?: number) => Promise<boolean>;
} {
  const { addWaterLog } = useAppState();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<WaterFormValues>({
    resolver: zodResolver(WaterSchema),
    mode: "onBlur",
    defaultValues: { amount: 250 },
  });

  const submitWaterLog = async (amountOverride?: number): Promise<boolean> => {
    if (amountOverride !== undefined) {
      const result = WaterSchema.safeParse({ amount: amountOverride });
      if (!result.success) {
        toast.error(result.error.errors[0]!.message);
        return false;
      }

      setIsLoading(true);
      try {
        await addWaterLog(amountOverride);
        toast.success(`Logged ${amountOverride} ml!`);
        return true;
      } catch {
        toast.error("Failed to log water. Please try again.");
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
            await addWaterLog(data.amount);
            toast.success(`Logged ${data.amount} ml!`);
            form.reset();
            resolve(true);
          } catch {
            toast.error("Failed to log water. Please try again.");
            resolve(false);
          } finally {
            setIsLoading(false);
          }
        },
        () => resolve(false),
      )();
    });
  };

  return { form, isLoading, submitWaterLog };
}
