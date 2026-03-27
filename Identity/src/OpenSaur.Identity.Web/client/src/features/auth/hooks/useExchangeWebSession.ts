import { useMutation } from "@tanstack/react-query";
import { exchangeWebSession, type ExchangeWebSessionRequest } from "../api/authApi";

export function useExchangeWebSession() {
  const { mutateAsync } = useMutation({
    mutationFn: exchangeWebSession
  });

  return {
    exchangeSession: (request: ExchangeWebSessionRequest) => mutateAsync(request)
  };
}
