import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type TdeeProfileFormValues, TdeeProfileSchema } from "../forms/schemas";
import { useAppState } from "../state/AppState";
import { inToCm, lbToKg, type LengthUnit, type WeightUnit } from "@/types";

export const ONBOARDING_TOTAL_STEPS = 4;

export interface UseOnboardingReturn {
  step: number;
  totalSteps: number;
  form: ReturnType<typeof useForm<TdeeProfileFormValues>>;
  weightUnit: WeightUnit;
  lengthUnit: LengthUnit;
  setWeightUnit: (u: WeightUnit) => void;
  setLengthUnit: (u: LengthUnit) => void;
  isLoading: boolean;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (s: number) => void;
  submit: () => Promise<void>;
}

export function useOnboarding(onComplete?: () => void): UseOnboardingReturn {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>("cm");
  const { saveTdeeProfile } = useAppState();

  const form = useForm<TdeeProfileFormValues>({
    resolver: zodResolver(TdeeProfileSchema),
    mode: "onBlur",
    defaultValues: {
      age: undefined,
      sex: "male",
      heightDisplay: undefined,
      weightDisplay: undefined,
      activityLevel: "moderate",
      goal: "maintain",
    },
  });

  const nextStep = useCallback(() => {
    setStep((s) => Math.min(s + 1, ONBOARDING_TOTAL_STEPS - 1));
  }, []);

  const prevStep = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const goToStep = useCallback((s: number) => {
    setStep(Math.max(0, Math.min(s, ONBOARDING_TOTAL_STEPS - 1)));
  }, []);

  const submit = useCallback(async () => {
    const values = form.getValues();
    const heightCm = lengthUnit === "in" ? inToCm(values.heightDisplay) : values.heightDisplay;
    const weightKg = weightUnit === "lb" ? lbToKg(values.weightDisplay) : values.weightDisplay;
    const targetWeightKg =
      values.targetWeightDisplay !== undefined
        ? weightUnit === "lb"
          ? lbToKg(values.targetWeightDisplay)
          : values.targetWeightDisplay
        : undefined;

    setIsLoading(true);
    try {
      await saveTdeeProfile({
        age: values.age,
        sex: values.sex,
        heightCm,
        weightKg,
        targetWeightKg,
        activityLevel: values.activityLevel,
        goal: values.goal,
      });
      onComplete?.();
    } finally {
      setIsLoading(false);
    }
  }, [form, lengthUnit, weightUnit, saveTdeeProfile, onComplete]);

  return {
    step,
    totalSteps: ONBOARDING_TOTAL_STEPS,
    form,
    weightUnit,
    lengthUnit,
    setWeightUnit,
    setLengthUnit,
    isLoading,
    nextStep,
    prevStep,
    goToStep,
    submit,
  };
}
