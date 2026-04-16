import { Box, Container, CssBaseline, ThemeProvider } from "@mui/material";
import type { ReactNode } from "react";
import { theme } from "../../theme";

type PageLayoutProps = {
  background: keyof typeof theme.custom.pageBackgrounds;
  children: ReactNode;
};

export function PageLayout({ background, children }: PageLayoutProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          background: theme.custom.pageBackgrounds[background]
        }}
      >
        <Container maxWidth="sm">{children}</Container>
      </Box>
    </ThemeProvider>
  );
}
