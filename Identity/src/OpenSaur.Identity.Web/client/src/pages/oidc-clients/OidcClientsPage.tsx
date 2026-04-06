import { Button, Stack } from "@mui/material";
import { useMemo, useState } from "react";
import { ProtectedShellTemplate } from "../../components/templates";
import {
  OidcClientFiltersDrawer,
  OidcClientFormDrawer,
  OidcClientsTable
} from "../../features/oidc-clients/components";
import {
  useCreateOidcClient,
  useDeleteOidcClient,
  useEditOidcClient,
  useOidcClientQuery,
  useOidcClientsQuery
} from "../../features/oidc-clients/hooks";
import {
  filterOidcClients,
  type OidcClientFilterValues
} from "../../features/oidc-clients/utils/filterOidcClients";
import { usePreferences } from "../../features/preferences/PreferenceProvider";

export function OidcClientsPage() {
  const [filters, setFilters] = useState<OidcClientFilterValues>({
    clientId: "",
    status: "active"
  });
  const [deletingOidcClientId, setDeletingOidcClientId] = useState<string | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedOidcClientId, setSelectedOidcClientId] = useState<string | null>(null);
  const { t } = usePreferences();
  const {
    data: oidcClients = [],
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

  return (
    <ProtectedShellTemplate
      subtitle={t("oidcClients.description")}
      title={t("oidcClients.title")}
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
              {t("common.filter")}
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
            {t("common.create")}
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
            if (!window.confirm(t("oidcClients.deactivateConfirm"))) {
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
    </ProtectedShellTemplate>
  );
}
