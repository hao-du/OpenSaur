import {
  Box,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography
} from "@mui/material";
import { X } from "../../../shared/icons";
import type { OidcClientDetails } from "../types";
import { OidcClientForm } from "./OidcClientForm";
import { usePreferences } from "../../preferences/PreferenceProvider";

type OidcClientFormDrawerProps = {
  errorMessage: string | null;
  initialValues?: OidcClientDetails | null;
  isEditMode: boolean;
  isLoading: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: {
    appPathBase: string;
    callbackPath: string;
    clientId: string;
    clientSecret: string;
    description: string;
    displayName: string;
    isActive: boolean;
    origins: string[];
    postLogoutPath: string;
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
  const { t } = usePreferences();
  const title = isEditMode ? t("oidcClients.form.editTitle") : t("oidcClients.form.createTitle");

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
            {title}
          </Typography>
          <IconButton aria-label={t("oidcClients.form.close")} onClick={onClose}>
            <X size={18} />
          </IconButton>
        </Stack>
        <Divider />
        {isLoading ? (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ flex: 1 }}>
            <CircularProgress size={28} />
            <Typography color="text.secondary">
              {t("oidcClients.form.loading")}
            </Typography>
          </Stack>
        ) : (
          <Box sx={{ flex: 1 }}>
            <OidcClientForm
              errorMessage={errorMessage}
              initialValues={{
                appPathBase: initialValues?.appPathBase ?? "/identity",
                callbackPath: initialValues?.callbackPath ?? "/auth/callback",
                clientId: initialValues?.clientId ?? "",
                clientSecret: "",
                description: initialValues?.description ?? "",
                displayName: initialValues?.displayName ?? "",
                isActive: initialValues?.isActive ?? true,
                originsText: (initialValues?.origins ?? []).join("\n"),
                postLogoutPath: initialValues?.postLogoutPath ?? "/login",
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
