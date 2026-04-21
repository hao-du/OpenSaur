import type { PropsWithChildren, ReactNode } from "react";
import { Box, Container, Divider, Paper, Stack, Typography } from "@mui/material";
import { EyebrowText } from "../atoms/EyebrowText";

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
              <EyebrowText>OpenSaur Zentry</EyebrowText>
              <Typography variant="h3">{title}</Typography>
              <Typography color="text.secondary">{description}</Typography>
            </Stack>
            <Divider />
            {children}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
