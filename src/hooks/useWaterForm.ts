import { useState } from "react";
import { useAppState } from "../state/AppState";

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 5000;

export function useWaterForm() {
  const { addWaterLog } = useAppState();
  const [amount, setAmount] = useState(250);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submitWaterLog = async (ml: number): Promise<boolean> => {
    if (!Number.isFinite(ml) || ml < MIN_AMOUNT || ml > MAX_AMOUNT) {
      setMessage(`Amount must be between ${MIN_AMOUNT} and ${MAX_AMOUNT} ml.`);
      return false;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      await addWaterLog(ml);
      setMessage(`Logged ${ml} ml!`);
      setAmount(250);
      return true;
    } catch {
      setMessage("Failed to log water. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { amount, setAmount, isLoading, message, submitWaterLog };
}
