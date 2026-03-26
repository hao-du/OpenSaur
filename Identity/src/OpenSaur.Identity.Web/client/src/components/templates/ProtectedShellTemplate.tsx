import type { PropsWithChildren, ReactNode } from "react";
import { AppBar, Box, Container, Stack, Toolbar, Typography } from "@mui/material";
import { BrandMark } from "../atoms";

type ProtectedShellTemplateProps = PropsWithChildren<{
  actions?: ReactNode;
  title: string;
  subtitle: string;
}>;

export function ProtectedShellTemplate({
  actions,
  children,
  title,
  subtitle
}: ProtectedShellTemplateProps) {
  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar
        color="transparent"
        elevation={0}
        position="static"
        sx={{ borderBottom: "1px solid rgba(11,110,79,0.10)" }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <BrandMark />
          {actions}
        </Toolbar>
      </AppBar>
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 4, md: 6 } }}
      >
        <Stack spacing={1.5}>
          <Typography variant="h2">{title}</Typography>
          <Typography color="text.secondary">{subtitle}</Typography>
        </Stack>
        <Box sx={{ mt: 4 }}>{children}</Box>
      </Container>
    </Box>
  );
}
