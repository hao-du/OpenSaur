import { useMutation } from "@tanstack/react-query";
import { logout } from "../api/authApi";

export function useLogout() {
  const { isPending, mutateAsync } = useMutation({
    mutationFn: logout
  });

  return {
    isLoggingOut: isPending,
    logout: () => mutateAsync()
  };
}
