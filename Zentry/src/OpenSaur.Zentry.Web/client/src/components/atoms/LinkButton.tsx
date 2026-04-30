import { Button, type ButtonProps } from "@mui/material";

export function LinkButton({
  children,
  size = "small",
  sx,
  variant = "text",
  ...props
}: ButtonProps) {
  const sxItems = Array.isArray(sx) ? sx : [sx];

  return (
    <Button
      {...props}
      size={size}
      sx={[
        { whiteSpace: "nowrap" },
        ...sxItems
      ]}
      variant={variant}
    >
      {children}
    </Button>
  );
}
