import type { PropsWithChildren } from "react";
import { Typography, type TypographyProps } from "@mui/material";

export function MetaText({ children, ...props }: PropsWithChildren<TypographyProps>) {
  return (
    <Typography
      color="text.secondary"
      variant="body2"
      {...props}
    >
      {children}
    </Typography>
  );
}
