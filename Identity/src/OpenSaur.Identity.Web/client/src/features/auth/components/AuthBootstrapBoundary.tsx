import type { PropsWithChildren } from "react";
import { CircularProgress, Stack, Typography } from "@mui/material";
import { useAuthBootstrap } from "../hooks/useAuthBootstrap";

export function AuthBootstrapBoundary({ children }: PropsWithChildren) {
  const { isBootstrapping } = useAuthBootstrap();

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
          Preparing your session...
        </Typography>
      </Stack>
    );
  }

  return <>{children}</>;
}
