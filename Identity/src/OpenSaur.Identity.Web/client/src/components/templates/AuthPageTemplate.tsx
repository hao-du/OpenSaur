import type { PropsWithChildren, ReactNode } from "react";
import { Box, Container, Divider, Paper, Stack, Typography } from "@mui/material";
import { BrandMark } from "../atoms";

type AuthPageTemplateProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: ReactNode;
}>;

export function AuthPageTemplate({
  children,
  eyebrow,
  title,
  description
}: AuthPageTemplateProps) {
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
            <BrandMark />
            <Stack spacing={1}>
              <Typography
                color="primary"
                textTransform="uppercase"
                variant="overline"
              >
                {eyebrow}
              </Typography>
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
