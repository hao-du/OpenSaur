import { Box, Container, CssBaseline, ThemeProvider, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { theme } from "../../theme";

type PageLayoutProps = {
  background: keyof typeof theme.custom.pageBackgrounds;
  children: ReactNode;
};

export function PageLayout({ background, children }: PageLayoutProps) {
  const currentYear = new Date().getFullYear();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          alignItems: "center",
          background: theme.custom.pageBackgrounds[background],
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minHeight: "100vh",
          px: 2,
          py: 4
        }}
      >
        <Container maxWidth="sm">
          {children}
        </Container>
        <Typography
          color="text.secondary"
          sx={{
            fontSize: "0.8rem",
            mt: 3,
            textAlign: "center"
          }}
        >
          {`Copyright © ${currentYear} CoreGate.`}
        </Typography>
      </Box>
    </ThemeProvider>
  );
}
