import type { OidcClientSummaryDto } from "../dtos/OidcClientSummaryDto";

export type OidcClientFilterValues = {
  clientId: string;
};

export function filterOidcClients(
  oidcClients: OidcClientSummaryDto[],
  filters: OidcClientFilterValues
) {
  const search = filters.clientId.trim().toLowerCase();

  return oidcClients.filter(client => {
    return search.length === 0
      || client.clientId.toLowerCase().includes(search)
      || client.displayName.toLowerCase().includes(search);
  });
}
