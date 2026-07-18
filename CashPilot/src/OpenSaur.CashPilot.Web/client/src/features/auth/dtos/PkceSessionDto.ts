export type PkceSessionDto = {
  codeVerifier: string;
  returnTo?: string | null;
  state: string;
};
