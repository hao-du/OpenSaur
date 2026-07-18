import { useMutation } from "@tanstack/react-query";
import { requireCurrentUserPasswordChange } from "../api/profileApi";

export function useRequirePasswordChange() {
  const mutation = useMutation({
    mutationFn: requireCurrentUserPasswordChange
  });

  return {
    isUpdating: mutation.isPending,
    requirePasswordChange: mutation.mutateAsync
  };
}
