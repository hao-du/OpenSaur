import type { OidcClientSummary } from "../types";

export type OidcClientFilterValues = {
  clientId: string;
  status: "active" | "all" | "inactive";
};

export function filterOidcClients(
  clients: OidcClientSummary[],
  filters: OidcClientFilterValues
) {
  const normalizedClientId = filters.clientId.trim().toLowerCase();

  return clients.filter(client => {
    const matchesClientId = !normalizedClientId
      || client.clientId.toLowerCase().includes(normalizedClientId);
    const matchesStatus = filters.status === "all"
      || (filters.status === "active" ? client.isActive : !client.isActive);

    return matchesClientId && matchesStatus;
  });
}
