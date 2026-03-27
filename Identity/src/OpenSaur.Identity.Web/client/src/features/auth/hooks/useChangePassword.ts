import { useMutation } from "@tanstack/react-query";
import { changePassword, type ChangePasswordRequest } from "../api/authApi";

export function useChangePassword() {
  const { isPending, mutateAsync } = useMutation({
    mutationFn: changePassword
  });

  return {
    changePassword: (request: ChangePasswordRequest) => mutateAsync(request),
    isChangingPassword: isPending
  };
}
