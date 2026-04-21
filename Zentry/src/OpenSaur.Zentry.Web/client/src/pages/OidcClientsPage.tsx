import { Button, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DefaultLayout } from "../components/layouts/DefaultLayout";
import { OidcClientFiltersDrawer } from "../features/oidc-clients/components/OidcClientFiltersDrawer";
import { OidcClientFormDrawer } from "../features/oidc-clients/components/OidcClientFormDrawer";
import { OidcClientsTable } from "../features/oidc-clients/components/OidcClientsTable";
import { useCreateOidcClient } from "../features/oidc-clients/hooks/useCreateOidcClient";
import { useDeleteOidcClient } from "../features/oidc-clients/hooks/useDeleteOidcClient";
import { useEditOidcClient } from "../features/oidc-clients/hooks/useEditOidcClient";
import { useOidcClientQuery } from "../features/oidc-clients/hooks/useOidcClientQuery";
import { useOidcClientsQuery } from "../features/oidc-clients/hooks/useOidcClientsQuery";
import {
  filterOidcClients,
  type OidcClientFilterValues
} from "../features/oidc-clients/utils/filterOidcClients";

export function OidcClientsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<OidcClientFilterValues>({
    clientId: ""
  });
  const [deletingOidcClientId, setDeletingOidcClientId] = useState<string | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedOidcClientId, setSelectedOidcClientId] = useState<string | null>(null);
  const {
    data: oidcClients = [],
    isForbidden,
    isError,
    isLoading,
    refetch
  } = useOidcClientsQuery();
  const {
    data: selectedOidcClient,
    isLoading: isSelectedOidcClientLoading
  } = useOidcClientQuery(selectedOidcClientId);
  const {
    createOidcClient,
    errorMessage: createErrorMessage,
    isCreating,
    resetError: resetCreateError
  } = useCreateOidcClient();
  const {
    editOidcClient,
    errorMessage: editErrorMessage,
    isEditing,
    resetError: resetEditError
  } = useEditOidcClient();
  const {
    deleteOidcClient,
    errorMessage: deleteErrorMessage,
    isDeleting,
    resetError: resetDeleteError
  } = useDeleteOidcClient();
  const activeFormErrorMessage = createErrorMessage ?? editErrorMessage;
  const filteredOidcClients = useMemo(
    () => filterOidcClients(oidcClients, filters),
    [filters, oidcClients]
  );

  useEffect(() => {
    if (!isForbidden) {
      return;
    }

    navigate("/forbidden", { replace: true });
  }, [isForbidden, navigate]);

  return (
    <DefaultLayout
      subtitle="Manage OpenID Connect applications registered through CoreGate."
      title="Applications"
    >
      <Stack spacing={3}>
        <Stack direction={{ md: "row", xs: "column" }} justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={2} sx={{ width: { md: "auto", xs: "100%" } }}>
            <Button
              onClick={() => {
                setIsFilterDrawerOpen(true);
              }}
              sx={{ width: { md: "auto", xs: "100%" } }}
              variant="outlined"
            >
              Filter
            </Button>
          </Stack>
          <Button
            onClick={() => {
              resetCreateError();
              setIsCreateDrawerOpen(true);
            }}
            sx={{ width: { md: "auto", xs: "100%" } }}
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
          onDeleteClient={oidcClientId => {
            resetDeleteError();
            if (!window.confirm("Delete this OIDC client?")) {
              return;
            }

            setDeletingOidcClientId(oidcClientId);
            void deleteOidcClient({ id: oidcClientId }).finally(() => {
              setDeletingOidcClientId(current => current === oidcClientId ? null : current);
            });
          }}
          onEditClient={oidcClientId => {
            resetEditError();
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
        errorMessage={activeFormErrorMessage}
        isEditMode={false}
        isLoading={false}
        isOpen={isCreateDrawerOpen}
        isSubmitting={isCreating}
        onClose={() => {
          setIsCreateDrawerOpen(false);
        }}
        onSubmit={async values => {
          await createOidcClient(values);
          setIsCreateDrawerOpen(false);
        }}
      />
      <OidcClientFormDrawer
        errorMessage={activeFormErrorMessage}
        initialValues={selectedOidcClient}
        isEditMode
        isLoading={isSelectedOidcClientLoading}
        isOpen={selectedOidcClientId !== null}
        isSubmitting={isEditing}
        onClose={() => {
          setSelectedOidcClientId(null);
        }}
        onSubmit={async values => {
          if (!selectedOidcClientId) {
            return;
          }

          await editOidcClient({
            ...values,
            id: selectedOidcClientId
          });
          setSelectedOidcClientId(null);
        }}
      />
    </DefaultLayout>
  );
}
