import { useState } from "react";
import { useAppState } from "../state/AppState";
import { inToCm, lbToKg, type LengthUnit, todayISO, type WeightUnit } from "../types";

export function useBodyForm() {
  const { addBodyMeasurement, userId } = useAppState();
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>("cm");
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [waist, setWaist] = useState("");
  const [chest, setChest] = useState("");
  const [hips, setHips] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submitMeasurement = async (): Promise<boolean> => {
    const weightVal = weight !== "" ? parseFloat(weight) : undefined;
    const bodyFatVal = bodyFat !== "" ? parseFloat(bodyFat) : undefined;
    const waistVal = waist !== "" ? parseFloat(waist) : undefined;
    const chestVal = chest !== "" ? parseFloat(chest) : undefined;
    const hipsVal = hips !== "" ? parseFloat(hips) : undefined;

    if (weightVal === undefined) {
      setMessage("Weight is required.");
      return false;
    }
    if (
      !Number.isFinite(weightVal) ||
      weightVal <= 0 ||
      weightVal > (weightUnit === "kg" ? 500 : 1100)
    ) {
      setMessage("Please enter a valid weight.");
      return false;
    }
    if (
      bodyFatVal !== undefined &&
      (!Number.isFinite(bodyFatVal) || bodyFatVal < 1 || bodyFatVal > 99)
    ) {
      setMessage("Body fat must be between 1 and 99%.");
      return false;
    }
    const MAX_LENGTH_CM = lengthUnit === "in" ? 500 : 1270; // ~500 in / 1270 cm
    if (
      waistVal !== undefined &&
      (!Number.isFinite(waistVal) || waistVal <= 0 || waistVal > MAX_LENGTH_CM)
    ) {
      setMessage("Please enter a valid waist measurement.");
      return false;
    }
    if (
      chestVal !== undefined &&
      (!Number.isFinite(chestVal) || chestVal <= 0 || chestVal > MAX_LENGTH_CM)
    ) {
      setMessage("Please enter a valid chest measurement.");
      return false;
    }
    if (
      hipsVal !== undefined &&
      (!Number.isFinite(hipsVal) || hipsVal <= 0 || hipsVal > MAX_LENGTH_CM)
    ) {
      setMessage("Please enter a valid hips measurement.");
      return false;
    }

    if (!userId) {
      setMessage("User not initialized. Please refresh.");
      return false;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      const weightKg = weightUnit === "lb" ? lbToKg(weightVal) : weightVal;
      const toStoredCm = (v: number | undefined) =>
        v === undefined ? undefined : lengthUnit === "in" ? inToCm(v) : v;

      await addBodyMeasurement({
        userId,
        measuredAt: todayISO(),
        weight: Math.round(weightKg * 100) / 100,
        bodyFat: bodyFatVal,
        waist: toStoredCm(waistVal),
        chest: toStoredCm(chestVal),
        hips: toStoredCm(hipsVal),
      });
      setMessage("Measurement saved!");
      resetForm();
      return true;
    } catch {
      setMessage("Failed to save measurement.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setWeight("");
    setBodyFat("");
    setWaist("");
    setChest("");
    setHips("");
  };

  return {
    weightUnit,
    setWeightUnit,
    lengthUnit,
    setLengthUnit,
    weight,
    setWeight,
    bodyFat,
    setBodyFat,
    waist,
    setWaist,
    chest,
    setChest,
    hips,
    setHips,
    isLoading,
    message,
    submitMeasurement,
    resetForm,
  };
}
