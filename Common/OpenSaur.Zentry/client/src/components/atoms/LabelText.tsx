import type { PropsWithChildren } from "react";
import { Typography } from "@mui/material";

export function LabelText({ children }: PropsWithChildren) {
  return (
    <Typography sx={{ fontWeight: 600 }}>
      {children}
    </Typography>
  );
}
