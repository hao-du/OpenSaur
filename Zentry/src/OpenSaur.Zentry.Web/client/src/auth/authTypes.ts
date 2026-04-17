export type AppRuntimeConfig = {
  appName: string;
  authority: string;
  basePath: string;
  clientId: string;
  postLogoutRedirectUri: string;
  redirectUri: string;
  scope: string;
};

export type PendingAuthRequest = {
  codeChallenge: string;
  codeChallengeMethod: "S256";
  codeVerifier: string;
  createdAtUtc: string;
  nonce: string;
  redirectPath: string;
  state: string;
};

export type TokenSet = {
  accessToken: string;
  expiresAtUtc: string;
  idToken?: string;
  scope?: string;
  tokenType: string;
};

export type UserProfile = {
  email?: string;
  preferredUsername?: string;
  roles?: string[];
  subject: string;
  workspaceId?: string;
};

export type AuthSession = {
  profile: UserProfile;
  tokenSet: TokenSet;
};
