export type OidcClientSummaryDto = {
  clientId: string;
  clientType: string;
  displayName: string;
  id: string;
  postLogoutRedirectUris: string[];
  redirectUris: string[];
  scope: string;
};
