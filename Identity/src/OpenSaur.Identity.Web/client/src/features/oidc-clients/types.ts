export type OidcClientSummary = {
  appPathBase: string;
  callbackPath: string;
  clientId: string;
  description: string;
  displayName: string;
  id: string;
  isActive: boolean;
  origins: string[];
  postLogoutPath: string;
  postLogoutRedirectUris: string[];
  redirectUris: string[];
  scope: string;
};

export type OidcClientDetails = {
  appPathBase: string;
  callbackPath: string;
  clientId: string;
  description: string;
  displayName: string;
  id: string;
  isActive: boolean;
  origins: string[];
  postLogoutPath: string;
  scope: string;
};

export type CreateOidcClientRequest = {
  appPathBase: string;
  callbackPath: string;
  clientId: string;
  clientSecret: string;
  description: string;
  displayName: string;
  origins: string[];
  postLogoutPath: string;
  scope: string;
};

export type CreateOidcClientResponse = {
  id: string;
};

export type EditOidcClientRequest = {
  appPathBase: string;
  callbackPath: string;
  clientId: string;
  clientSecret: string;
  description: string;
  displayName: string;
  id: string;
  isActive: boolean;
  origins: string[];
  postLogoutPath: string;
  scope: string;
};

export type DeleteOidcClientRequest = {
  id: string;
};
