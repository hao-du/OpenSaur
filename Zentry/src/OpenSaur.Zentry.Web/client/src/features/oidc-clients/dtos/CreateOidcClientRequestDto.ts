export type CreateOidcClientRequestDto = {
  clientId: string;
  clientType: string;
  clientSecret: string;
  displayName: string;
  postLogoutRedirectUris: string[];
  redirectUris: string[];
  scope: string;
};
