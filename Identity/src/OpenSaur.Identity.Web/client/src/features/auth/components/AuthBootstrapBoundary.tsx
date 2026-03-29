import type { PropsWithChildren } from "react";
import { CircularProgress, Stack, Typography } from "@mui/material";
import { useAuthBootstrap } from "../hooks/useAuthBootstrap";
import { usePreferences } from "../../preferences/PreferenceProvider";

export function AuthBootstrapBoundary({ children }: PropsWithChildren) {
  const { isBootstrapping } = useAuthBootstrap();
  const { t } = usePreferences();

  if (isBootstrapping) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        spacing={2}
      >
        <CircularProgress size={28} />
        <Typography color="text.secondary">
          {t("auth.preparingSession")}
        </Typography>
      </Stack>
    );
  }

  return <>{children}</>;
}
