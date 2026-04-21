export type CreateOidcClientRequestDto = {
  clientId: string;
  clientSecret: string;
  displayName: string;
  postLogoutRedirectUris: string[];
  redirectUris: string[];
  scope: string;
};
