import type { PropsWithChildren } from "react";
import { Typography } from "@mui/material";

type PageTitleTextProps = PropsWithChildren<{
  as?: "h1" | "h2" | "h3" | "div";
  variant?: "h3" | "h5";
}>;

export function PageTitleText({
  as = "div",
  children,
  variant = "h5"
}: PageTitleTextProps) {
  return (
    <Typography
      component={as}
      variant={variant}
    >
      {children}
    </Typography>
  );
}
