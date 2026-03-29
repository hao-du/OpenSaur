import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { exchangeWebSession, type ExchangeWebSessionRequest } from "../api/authApi";

export function useExchangeWebSession() {
  const { mutateAsync } = useMutation({
    mutationFn: exchangeWebSession
  });
  const exchangeSession = useCallback((request: ExchangeWebSessionRequest) => {
    return mutateAsync(request);
  }, [mutateAsync]);

  return {
    exchangeSession
  };
}
