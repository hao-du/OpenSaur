import { Button, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { ConfirmationDialog } from "../../../components/organisms/ConfirmationDialog";
import { useNavigate } from "react-router-dom";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useAuthSession } from "../../auth/hooks/AuthContext";
import { OidcClientFiltersDrawer } from "../components/OidcClientFiltersDrawer";
import type { OidcClientFilterValues } from "../components/OidcClientFiltersDrawer";
import { OidcClientFormDrawer } from "../components/OidcClientFormDrawer";
import { OidcClientsTable } from "../components/OidcClientsTable";
import { useDeleteOidcClient } from "../hooks/useDeleteOidcClient";
import { useOidcClientQuery } from "../hooks/useOidcClientQuery";
import { useOidcClientsQuery } from "../hooks/useOidcClientsQuery";

export function OidcClientsPage() {
  const navigate = useNavigate();
  const { clearSession } = useAuthSession();
  const [clientPendingDelete, setClientPendingDelete] = useState<{ displayName: string; id: string } | null>(null);
  const [filters, setFilters] = useState<OidcClientFilterValues>({
    clientId: ""
  });
  const [deletingOidcClientId, setDeletingOidcClientId] = useState<string | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedOidcClientId, setSelectedOidcClientId] = useState<string | null>(null);
  const { data: oidcClients = [], isForbidden, isUnauthorized, isError, isLoading, refetch } = useOidcClientsQuery();
  const { data: selectedOidcClient, isLoading: isSelectedOidcClientLoading } = useOidcClientQuery(selectedOidcClientId);
  const { deleteOidcClient, errorMessage: deleteErrorMessage, isDeleting, resetError: resetDeleteError } = useDeleteOidcClient();
  const filteredOidcClients = useMemo(() => {
    const search = filters.clientId.trim().toLowerCase();

    return oidcClients.filter(client => {
      return search.length === 0
        || client.clientId.toLowerCase().includes(search)
        || client.displayName.toLowerCase().includes(search);
    });
  }, [filters, oidcClients]);

  useEffect(() => {
    if (!isUnauthorized) {
      return;
    }

    clearSession();
    navigate("/prepare-session", { replace: true });
  }, [clearSession, isUnauthorized, navigate]);

  useEffect(() => {
    if (!isForbidden) {
      return;
    }

    navigate("/forbidden", { replace: true });
  }, [isForbidden, navigate]);

  return (
    <DefaultLayout
      subtitle="Manage OpenID Connect applications registered through CoreGate."
      title="OIDC Clients"
    >
      <Stack spacing={3}>
        <Stack direction={{ md: "row", xs: "column" }} justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={2} sx={layoutStyles.responsiveActionGroup}>
            <Button
              onClick={() => {
                setIsFilterDrawerOpen(true);
              }}
              sx={layoutStyles.responsiveActionButton}
              variant="outlined"
            >
              Filter
            </Button>
          </Stack>
          <Button
            onClick={() => {
              setIsCreateDrawerOpen(true);
            }}
            sx={layoutStyles.responsiveActionButton}
            variant="contained"
          >
            Create
          </Button>
        </Stack>
        <OidcClientsTable
          actionErrorMessage={deleteErrorMessage}
          clients={filteredOidcClients}
          isDeletingClientId={isDeleting ? deletingOidcClientId : null}
          isError={isError}
          isLoading={isLoading}
          onDeleteClient={(oidcClientId, displayName) => {
            resetDeleteError();
            setClientPendingDelete({ displayName, id: oidcClientId });
          }}
          onEditClient={oidcClientId => {
            setSelectedOidcClientId(oidcClientId);
          }}
          onRetry={() => {
            void refetch();
          }}
        />
      </Stack>
      <OidcClientFiltersDrawer
        initialValues={filters}
        isOpen={isFilterDrawerOpen}
        onApply={async nextFilters => {
          await Promise.resolve();
          setFilters(nextFilters);
          setIsFilterDrawerOpen(false);
        }}
        onClose={() => {
          setIsFilterDrawerOpen(false);
        }}
      />
      <OidcClientFormDrawer
        isEditMode={false}
        isLoading={false}
        isOpen={isCreateDrawerOpen}
        onClose={() => {
          setIsCreateDrawerOpen(false);
        }}
      />
      <OidcClientFormDrawer
        initialValues={selectedOidcClient}
        isEditMode
        isLoading={isSelectedOidcClientLoading}
        isOpen={selectedOidcClientId !== null}
        onClose={() => {
          setSelectedOidcClientId(null);
        }}
      />
      <ConfirmationDialog
        confirmLabel="Delete"
        isConfirming={isDeleting}
        message={clientPendingDelete == null
          ? ""
          : `Delete ${clientPendingDelete.displayName}? This action cannot be undone.`}
        onClose={() => {
          if (isDeleting) {
            return;
          }

          setClientPendingDelete(null);
        }}
        onConfirm={() => {
          if (clientPendingDelete == null) {
            return;
          }

          setDeletingOidcClientId(clientPendingDelete.id);
          void deleteOidcClient({ id: clientPendingDelete.id }).finally(() => {
            setDeletingOidcClientId(current => current === clientPendingDelete.id ? null : current);
            setClientPendingDelete(current => current?.id === clientPendingDelete.id ? null : current);
          });
        }}
        open={clientPendingDelete !== null}
        title="Delete application"
      />
    </DefaultLayout>
  );
}
