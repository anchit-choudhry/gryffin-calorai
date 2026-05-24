import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type DietProfileFormValues, DietProfileSchema } from "@/forms/schemas";
import { useAppState } from "@/state/AppState";
import type { DietPreset, RestrictionFlag } from "@/types";

export function useDietProfile() {
  const { dietProfile, saveDietProfile } = useAppState();

  const form = useForm<DietProfileFormValues>({
    resolver: zodResolver(DietProfileSchema),
    defaultValues: {
      preset: (dietProfile?.preset as DietPreset) ?? "generic",
      restrictions: (dietProfile?.restrictions as RestrictionFlag[]) ?? [],
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    await saveDietProfile(data.preset as DietPreset, data.restrictions as RestrictionFlag[]);
  });

  return { form, onSubmit, dietProfile };
}
