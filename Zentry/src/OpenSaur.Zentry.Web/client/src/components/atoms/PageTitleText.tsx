import type { PropsWithChildren } from "react";
import { Typography, type TypographyProps } from "@mui/material";

type PageTitleTextProps = PropsWithChildren<TypographyProps & {
  as?: "h1" | "h2" | "h3" | "div";
  variant?: "h3" | "h5" | "h6";
}>;

export function PageTitleText({
  as = "div",
  children,
  variant = "h5",
  ...props
}: PageTitleTextProps) {
  return (
    <Typography
      component={as}
      variant={variant}
      {...props}
    >
      {children}
    </Typography>
  );
}
