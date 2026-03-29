import { useMutation } from "@tanstack/react-query";
import {
  updateCurrentUserSettings,
  type UpdateCurrentUserSettingsRequest
} from "../../auth/api/authApi";
import { getApiErrorMessage } from "../../../shared/api/getApiErrorMessage";

export function useUpdateCurrentUserSettings() {
  const mutation = useMutation({
    mutationFn: updateCurrentUserSettings
  });

  return {
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, "We couldn't save your settings right now.")
      : null,
    isSaving: mutation.isPending,
    resetError: mutation.reset,
    updateSettings: (request: UpdateCurrentUserSettingsRequest) => mutation.mutateAsync(request)
  };
}
