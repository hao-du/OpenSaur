export type OidcClientSummary = {
  appPathBase: string;
  clientId: string;
  description: string;
  displayName: string;
  id: string;
  isActive: boolean;
  origins: string[];
  postLogoutRedirectUris: string[];
  redirectUris: string[];
  scope: string;
};

export type OidcClientDetails = {
  appPathBase: string;
  clientId: string;
  description: string;
  displayName: string;
  id: string;
  isActive: boolean;
  origins: string[];
  scope: string;
};

export type CreateOidcClientRequest = {
  appPathBase: string;
  clientId: string;
  clientSecret: string;
  description: string;
  displayName: string;
  origins: string[];
  scope: string;
};

export type CreateOidcClientResponse = {
  id: string;
};

export type EditOidcClientRequest = {
  appPathBase: string;
  clientId: string;
  clientSecret: string;
  description: string;
  displayName: string;
  id: string;
  isActive: boolean;
  origins: string[];
  scope: string;
};

export type DeleteOidcClientRequest = {
  id: string;
};
