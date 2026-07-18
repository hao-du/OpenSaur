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
        {
          borderRadius: 1.25,
          fontSize: "0.88rem",
          fontWeight: 500,
          letterSpacing: "0.04em",
          minHeight: 38,
          px: 2,
          textTransform: "uppercase",
          transition: "all 120ms ease",
          ...(variant === "contained"
            ? {
              boxShadow: "none",
              "&:hover": {
                boxShadow: "none",
                filter: "brightness(0.96)"
              }
            }
            : {
              borderWidth: 1,
              "&:hover": {
                borderWidth: 1,
                bgcolor: "rgba(0,204,255,0.08)"
              }
            }),
          "&.Mui-disabled": {
            opacity: 0.6
          }
        },
        noWrap ? { whiteSpace: "nowrap" } : {},
        ...sxItems
      ]}
      variant={variant}
    >
      {children}
    </Button>
  );
}
