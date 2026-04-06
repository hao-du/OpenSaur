import type { CSSProperties, PropsWithChildren, ReactNode } from "react";
import { Stack, type StackProps } from "@mui/material";
import { FormSupportText } from "./FormSupportText";

const fieldBlockGapInPixels = 6;

type FormFieldBlockProps = PropsWithChildren<Omit<StackProps, "children"> & {
  supportContent?: ReactNode;
}>;

export function FormFieldBlock({
  children,
  style,
  supportContent,
  ...props
}: FormFieldBlockProps) {
  const fieldBlockStyle: CSSProperties = {
    rowGap: `${fieldBlockGapInPixels}px`,
    ...style
  };

  return (
    <Stack
      data-testid="form-field-block"
      {...props}
      style={fieldBlockStyle}
    >
      {children}
      {typeof supportContent === "string"
        ? <FormSupportText>{supportContent}</FormSupportText>
        : supportContent}
    </Stack>
  );
}
