export type CallbackResultDto = {
  code: string | null;
  error: string | null;
  errorDescription: string | null;
  hasPkceSession: boolean;
  returnedState: string | null;
  stateMatches: boolean | null;
  storedState: string | null;
};