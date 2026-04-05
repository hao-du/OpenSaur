import { Button, Stack } from "@mui/material";
import { useState } from "react";
import { ProtectedShellTemplate } from "../../components/templates";
import {
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
import { usePreferences } from "../../features/preferences/PreferenceProvider";

export function OidcClientsPage() {
  const [deletingOidcClientId, setDeletingOidcClientId] = useState<string | null>(null);
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

  return (
    <ProtectedShellTemplate
      subtitle={t("oidcClients.description")}
      title={t("oidcClients.title")}
    >
      <Stack spacing={3}>
        <Stack direction={{ md: "row", xs: "column" }} justifyContent="space-between" spacing={2}>
          <div />
          <Button
            onClick={() => {
              resetCreateError();
              setIsCreateDrawerOpen(true);
            }}
            variant="contained"
          >
            {t("common.create")}
          </Button>
        </Stack>
        <OidcClientsTable
          actionErrorMessage={deleteErrorMessage}
          clients={oidcClients}
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
