import type { PropsWithChildren } from "react";
import { Typography } from "@mui/material";

export function MetaText({ children }: PropsWithChildren) {
  return (
    <Typography
      color="text.secondary"
      variant="body2"
    >
      {children}
    </Typography>
  );
}
