export type EditOidcClientRequestDto = {
  clientId: string;
  clientSecret: string;
  displayName: string;
  id: string;
  postLogoutRedirectUris: string[];
  redirectUris: string[];
  scope: string;
};
