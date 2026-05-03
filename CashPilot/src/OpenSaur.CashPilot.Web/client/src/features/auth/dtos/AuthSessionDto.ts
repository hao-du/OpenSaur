export type AuthSessionDto = {
  accessToken: string;
  expiresAt: string;
  idToken: string | null;
  scope: string | null;
  tokenType: string;
};