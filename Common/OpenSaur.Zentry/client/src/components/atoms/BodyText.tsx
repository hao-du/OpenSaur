import type { PropsWithChildren } from "react";
import { Typography } from "@mui/material";

export function BodyText({ children }: PropsWithChildren) {
  return (
    <Typography color="text.secondary">
      {children}
    </Typography>
  );
}
