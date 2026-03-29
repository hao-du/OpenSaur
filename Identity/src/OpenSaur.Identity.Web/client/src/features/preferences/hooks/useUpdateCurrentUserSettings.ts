import { useMutation } from "@tanstack/react-query";
import {
  updateCurrentUserSettings,
  type UpdateCurrentUserSettingsRequest
} from "../../auth/api/authApi";
import { getApiErrorMessage } from "../../../shared/api/getApiErrorMessage";
import { i18n } from "../../localization/i18n";

export function useUpdateCurrentUserSettings() {
  const mutation = useMutation({
    mutationFn: updateCurrentUserSettings
  });

  return {
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, i18n.t("settings.error"))
      : null,
    isSaving: mutation.isPending,
    resetError: mutation.reset,
    updateSettings: (request: UpdateCurrentUserSettingsRequest) => mutation.mutateAsync(request)
  };
}
