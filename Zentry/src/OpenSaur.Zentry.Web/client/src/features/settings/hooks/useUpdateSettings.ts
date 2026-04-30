import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { updateSettings } from "../api/settingsApi";
import type { UpdateSettingsRequestDto } from "../dtos/UpdateSettingsRequestDto";
import { useSettings } from "../provider/SettingProvider";

export function useUpdateSettings() {
  const { t } = useSettings();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (request: UpdateSettingsRequestDto) => updateSettings(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    }
  });

  return {
    errorMessage: mutation.error ? getApiErrorMessage(mutation.error, t("settings.updateError")) : null,
    isSaving: mutation.isPending,
    resetError: mutation.reset,
    updateSettings: (request: UpdateSettingsRequestDto) => mutation.mutateAsync(request)
  };
}
