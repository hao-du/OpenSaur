import { useMutation } from "@tanstack/react-query";
import { refreshWebSession } from "../api/authApi";

export function useRefreshWebSession() {
  const { mutateAsync } = useMutation({
    mutationFn: refreshWebSession
  });

  return {
    refreshSession: mutateAsync
  };
}
