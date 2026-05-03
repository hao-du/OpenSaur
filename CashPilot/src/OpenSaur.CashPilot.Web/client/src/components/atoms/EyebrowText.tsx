import type { PropsWithChildren } from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import { Typography } from "@mui/material";

type EyebrowTextProps = PropsWithChildren<{
  sx?: SxProps<Theme>;
}>;

export function EyebrowText({ children, sx }: EyebrowTextProps) {
  return (
    <Typography
      color="primary.main"
      sx={{
        fontSize: "0.85rem",
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        ...sx
      }}
    >
      {children}
    </Typography>
  );
}
