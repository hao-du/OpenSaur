export type ConfigDto = {
  appName: string;
  authority: string;
  basePath: string;
  apiBaseUrl?: string;
  clientId: string;
  postLogoutRedirectUri: string;
  redirectUri: string;
  scope: string;
};
