export type TokenResponseDto = {
  accessToken: string;
  expiresIn: number;
  idToken: string | null;
  scope: string | null;
  tokenType: string;
};