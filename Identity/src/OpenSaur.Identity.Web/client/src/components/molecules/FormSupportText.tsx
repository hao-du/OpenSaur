import type { CSSProperties, PropsWithChildren } from "react";
import { Typography, useTheme, type TypographyProps } from "@mui/material";
import { alpha } from "@mui/material/styles";

type FormSupportTextProps = PropsWithChildren<Omit<TypographyProps, "children">>;

export function FormSupportText({
  children,
  style,
  ...props
}: FormSupportTextProps) {
  const theme = useTheme();
  const supportTextStyle: CSSProperties = {
    color: alpha(theme.palette.secondary.main, 0.82),
    lineHeight: 1.55,
    ...style
  };

  return (
    <Typography
      data-form-support-text="true"
      variant="body2"
      {...props}
      style={supportTextStyle}
    >
      {children}
    </Typography>
  );
}
