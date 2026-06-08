import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAppState } from "../state/AppState";
import {
  type BodyMeasurementId,
  inToCm,
  lbToKg,
  type LengthUnit,
  todayISO,
  type WeightUnit,
} from "../types";
import { type BodyFormValues, makeBodySchema } from "../forms/schemas";

interface UseBodyFormOptions {
  measurementId?: BodyMeasurementId;
  initialValues?: Partial<BodyFormValues>;
}

export function useBodyForm(options?: UseBodyFormOptions): {
  form: ReturnType<typeof useForm<BodyFormValues>>;
  weightUnit: WeightUnit;
  setWeightUnit: (unit: WeightUnit) => void;
  lengthUnit: LengthUnit;
  setLengthUnit: (unit: LengthUnit) => void;
  isLoading: boolean;
  submitMeasurement: () => Promise<boolean>;
} {
  const { measurementId, initialValues } = options ?? {};
  const { addBodyMeasurement, updateBodyMeasurement, userId } = useAppState();
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>("cm");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BodyFormValues>({
    resolver: zodResolver(makeBodySchema(weightUnit, lengthUnit)),
    defaultValues: {
      weight: initialValues?.weight ?? "",
      bodyFat: initialValues?.bodyFat ?? "",
      waist: initialValues?.waist ?? "",
      chest: initialValues?.chest ?? "",
      hips: initialValues?.hips ?? "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    form.clearErrors();
  }, [weightUnit, lengthUnit, form]);

  const submitMeasurement = async (): Promise<boolean> => {
    if (!userId) {
      toast.error("Not ready - please refresh");
      return false;
    }

    return new Promise<boolean>((resolve) => {
      form.handleSubmit(
        async (data) => {
          setIsLoading(true);
          try {
            const weightVal = parseFloat(data.weight);
            const bodyFatVal = data.bodyFat ? parseFloat(data.bodyFat) : undefined;
            const waistVal = data.waist ? parseFloat(data.waist) : undefined;
            const chestVal = data.chest ? parseFloat(data.chest) : undefined;
            const hipsVal = data.hips ? parseFloat(data.hips) : undefined;

            const weightKg = weightUnit === "lb" ? lbToKg(weightVal) : weightVal;
            const toStoredCm = (v: number | undefined) =>
              v === undefined ? undefined : lengthUnit === "in" ? inToCm(v) : v;

            const payload = {
              weight: Math.round(weightKg * 100) / 100,
              bodyFat: bodyFatVal,
              waist: toStoredCm(waistVal),
              chest: toStoredCm(chestVal),
              hips: toStoredCm(hipsVal),
            };

            if (measurementId) {
              await updateBodyMeasurement(measurementId, payload);
              toast.success("Measurement updated!");
            } else {
              await addBodyMeasurement({ userId, measuredAt: todayISO(), ...payload });
              toast.success("Measurement saved!");
            }

            form.reset();
            resolve(true);
          } catch {
            toast.error("Failed to save measurement.");
            resolve(false);
          } finally {
            setIsLoading(false);
          }
        },
        () => resolve(false),
      )();
    });
  };

  return {
    form,
    weightUnit,
    setWeightUnit,
    lengthUnit,
    setLengthUnit,
    isLoading,
    submitMeasurement,
  };
}
