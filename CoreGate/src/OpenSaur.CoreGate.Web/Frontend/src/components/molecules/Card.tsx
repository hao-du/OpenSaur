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
        border: "1px solid rgba(13,59,102,0.12)",
        boxShadow: "0 24px 70px rgba(13,59,102,0.12)",
        overflow: "hidden"
      }}
    >
      <Box
        sx={{
          background: "linear-gradient(135deg, #0d3b66 0%, #144f8a 100%)",
          color: "white",
          px: 4,
          py: 5
        }}
      >
        <Typography variant="overline" sx={{ letterSpacing: 2.2 }}>
          CoreGate
        </Typography>
        <Typography variant="h3" sx={{ mt: 1 }}>
          {title}
        </Typography>
        <Typography sx={{ mt: 1.5, opacity: 0.88 }}>{subtitle}</Typography>
      </Box>
      <CardContent sx={{ p: 4 }}>{children}</CardContent>
    </MuiCard>
  );
}
