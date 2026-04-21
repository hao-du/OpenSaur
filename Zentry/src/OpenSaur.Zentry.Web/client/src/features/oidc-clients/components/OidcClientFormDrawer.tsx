import { Box, CircularProgress, Divider, Drawer, IconButton, Stack, Typography } from "@mui/material";
import { X } from "lucide-react";
import type { OidcClientDetailsDto } from "../dtos/OidcClientDetailsDto";
import { OidcClientForm } from "./OidcClientForm";

type OidcClientFormDrawerProps = {
  errorMessage: string | null;
  initialValues?: OidcClientDetailsDto | null;
  isEditMode: boolean;
  isLoading: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: {
    clientId: string;
    clientType: string;
    clientSecret: string;
    displayName: string;
    postLogoutRedirectUris: string[];
    redirectUris: string[];
    scope: string;
  }) => Promise<void>;
};

export function OidcClientFormDrawer({
  errorMessage,
  initialValues,
  isEditMode,
  isLoading,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit
}: OidcClientFormDrawerProps) {
  return (
    <Drawer
      anchor="right"
      onClose={onClose}
      open={isOpen}
      sx={{
        "& .MuiDrawer-paper": {
          p: 3,
          width: { sm: 620, xs: "100%" }
        }
      }}
    >
      <Stack spacing={3} sx={{ height: "100%" }}>
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
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ flex: 1 }}>
            <CircularProgress size={28} />
            <Typography color="text.secondary">Loading application...</Typography>
          </Stack>
        ) : (
          <Box sx={{ flex: 1 }}>
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
              onSubmit={onSubmit}
            />
          </Box>
        )}
      </Stack>
    </Drawer>
  );
}
