import { useMutation } from "@tanstack/react-query";
import { login, type LoginRequest } from "../api/authApi";

export function useLogin() {
  const { isPending, mutateAsync } = useMutation({
    mutationFn: login
  });

  return {
    isLoggingIn: isPending,
    login: (request: LoginRequest) => mutateAsync(request)
  };
}
