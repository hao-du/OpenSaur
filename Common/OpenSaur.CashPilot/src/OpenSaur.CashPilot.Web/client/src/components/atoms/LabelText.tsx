import type { PropsWithChildren } from "react";
import { Typography, type TypographyProps } from "@mui/material";

export function LabelText({ children, sx, ...props }: PropsWithChildren<TypographyProps>) {
  return (
    <Typography
      sx={{
        fontWeight: 600,
        ...sx
      }}
      {...props}
    >
      {children}
    </Typography>
  );
}
