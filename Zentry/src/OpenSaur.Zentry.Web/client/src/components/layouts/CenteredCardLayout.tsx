import type { PropsWithChildren, ReactNode } from "react";
import { Box, Container, Divider, Paper, Stack } from "@mui/material";
import { BodyText } from "../atoms/BodyText";
import { EyebrowText } from "../atoms/EyebrowText";
import { PageTitleText } from "../atoms/PageTitleText";

type CenteredCardLayoutProps = PropsWithChildren<{
  description: ReactNode;
  title: string;
}>;

export function CenteredCardLayout({
  children,
  description,
  title
}: CenteredCardLayoutProps) {
  return (
    <Box
      sx={{
        alignItems: "center",
        background:
          "linear-gradient(180deg, rgba(11,110,79,0.10) 0%, rgba(31,60,136,0.06) 100%)",
        display: "flex",
        minHeight: "100vh",
        py: { xs: 4, md: 8 }
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            border: "1px solid rgba(11,110,79,0.12)",
            p: { xs: 3, sm: 5 }
          }}
        >
          <Stack spacing={2.5}>
            <Stack spacing={0.75}>
              <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
                <Box
                  alt="Zentry"
                  component="img"
                  src="/zentry-logo.svg"
                  sx={{
                    display: "block",
                    height: 34,
                    width: 34
                  }}
                />
                <EyebrowText
                  sx={{
                    fontSize: "0.95rem",
                    letterSpacing: "0.14em"
                  }}
                >
                  Zentry
                </EyebrowText>
              </Box>
              <PageTitleText variant="h3">{title}</PageTitleText>
              <BodyText>{description}</BodyText>
            </Stack>
            <Divider />
            {children}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
