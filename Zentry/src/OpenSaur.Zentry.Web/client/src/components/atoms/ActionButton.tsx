import { Button, type ButtonProps } from "@mui/material";

type ActionButtonProps = ButtonProps & {
  noWrap?: boolean;
};

export function ActionButton({
  children,
  noWrap = true,
  sx,
  variant = "contained",
  ...props
}: ActionButtonProps) {
  const sxItems = Array.isArray(sx) ? sx : [sx];

  return (
    <Button
      {...props}
      sx={[
        noWrap ? { whiteSpace: "nowrap" } : {},
        ...sxItems
      ]}
      variant={variant}
    >
      {children}
    </Button>
  );
}
