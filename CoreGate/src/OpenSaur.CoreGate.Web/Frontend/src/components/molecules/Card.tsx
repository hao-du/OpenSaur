import { Box, Card as MuiCard, CardContent, Typography } from "@mui/material";
import type { ReactNode } from "react";

type CardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function Card({ title, subtitle, children }: CardProps) {
  return (
    <MuiCard
      elevation={0}
      sx={{
        overflow: "hidden",
        position: "relative"
      }}
    >
      <Box
        sx={{
          backgroundColor: "background.paper",
          borderBottom: (currentTheme) => `1px solid ${currentTheme.custom.border.subtle}`,
          color: "text.primary",
          px: 4,
          py: 5
        }}
      >
        <Box sx={{ alignItems: "center", display: "flex", gap: 1.5, mb: 2 }}>
          <Box
            component="img"
            src="/coregate-logo.svg"
            alt="CoreGate"
            sx={{
              display: "block",
              height: 34,
              width: 34
            }}
          />
          <Typography
            sx={{
              color: "primary.main",
              fontSize: "0.9rem",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase"
            }}
          >
            CoreGate
          </Typography>
        </Box>
        <Typography variant="h3" sx={{ mt: 1, maxWidth: 360 }}>
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 420 }}>
          {subtitle}
        </Typography>
      </Box>
      <CardContent sx={{ p: 4 }}>{children}</CardContent>
    </MuiCard>
  );
}
