import type { CSSProperties, PropsWithChildren } from "react";
import { Stack, type StackProps } from "@mui/material";

const fieldListGapInPixels = 20;

type FormFieldListProps = PropsWithChildren<Omit<StackProps, "children">>;

export function FormFieldList({
  children,
  style,
  ...props
}: FormFieldListProps) {
  const fieldListStyle: CSSProperties = {
    gap: `${fieldListGapInPixels}px`,
    ...style
  };

  return (
    <Stack
      data-testid="form-field-list"
      {...props}
      style={fieldListStyle}
    >
      {children}
    </Stack>
  );
}
