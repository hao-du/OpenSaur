import { Box, CircularProgress, Divider, Drawer, IconButton, Stack, Typography } from "@mui/material";
import { useEffect } from "react";
import { X } from "lucide-react";
import type { OidcClientDetailsDto } from "../dtos/OidcClientDetailsDto";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useCreateOidcClient } from "../hooks/useCreateOidcClient";
import { useEditOidcClient } from "../hooks/useEditOidcClient";
import { OidcClientForm } from "./OidcClientForm";

type OidcClientFormDrawerProps = {
  initialValues?: OidcClientDetailsDto | null;
  isEditMode: boolean;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
};

export function OidcClientFormDrawer({
  initialValues,
  isEditMode,
  isLoading,
  isOpen,
  onClose
}: OidcClientFormDrawerProps) {
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
  const errorMessage = isEditMode ? editErrorMessage : createErrorMessage;
  const isSubmitting = isEditMode ? isEditing : isCreating;

  useEffect(() => {
    if (!isOpen) {
      resetCreateError();
      resetEditError();
    }
  }, [isOpen, resetCreateError, resetEditError]);

  return (
    <Drawer
      anchor="right"
      onClose={onClose}
      open={isOpen}
      sx={layoutStyles.drawerPaperWide}
    >
      <Stack spacing={3} sx={layoutStyles.drawerContent}>
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <Typography component="h2" variant="h5">
            {isEditMode ? "Edit application" : "Create application"}
          </Typography>
          <IconButton aria-label="Close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </Stack>
        <Divider />
        {isLoading ? (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={layoutStyles.drawerLoadingState}>
            <CircularProgress size={28} />
            <Typography color="text.secondary">Loading application...</Typography>
          </Stack>
        ) : (
          <Box sx={layoutStyles.drawerBody}>
            <OidcClientForm
              errorMessage={errorMessage}
              initialValues={{
                clientId: initialValues?.clientId ?? "",
                clientType: initialValues?.clientType ?? "public",
                clientSecret: "",
                displayName: initialValues?.displayName ?? "",
                postLogoutRedirectUrisText: (initialValues?.postLogoutRedirectUris ?? []).join("\n"),
                redirectUrisText: (initialValues?.redirectUris ?? []).join("\n"),
                scope: initialValues?.scope ?? "openid profile email roles offline_access api"
              }}
              isEditMode={isEditMode}
              isSubmitting={isSubmitting}
              onSubmit={async values => {
                if (isEditMode) {
                  if (initialValues == null) {
                    return;
                  }

                  await editOidcClient({
                    ...values,
                    id: initialValues.id
                  });
                  onClose();
                  return;
                }

                await createOidcClient(values);
                onClose();
              }}
            />
          </Box>
        )}
      </Stack>
    </Drawer>
  );
}
