import type { PropsWithChildren } from "react";
import { Typography, type TypographyProps } from "@mui/material";

export function BodyText({ children, ...props }: PropsWithChildren<TypographyProps>) {
  return (
    <Typography color="text.secondary" {...props}>
      {children}
    </Typography>
  );
}
