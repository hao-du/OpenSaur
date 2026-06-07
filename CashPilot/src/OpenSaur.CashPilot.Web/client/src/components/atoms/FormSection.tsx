import { Stack, type StackProps } from "@mui/material";
import { layoutStyles } from "../../infrastructure/theme/theme";

type Props = StackProps;

export function FormSection({ children, sx, ...props }: Props) {
  return (
    <Stack
      spacing={2}
      sx={[
        layoutStyles.formSection,
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {children}
    </Stack>
  );
}
