import type { ReactNode } from "react";
import { InputAdornment, TextField, type TextFieldProps } from "@mui/material";

export type AuthTextFieldProps = TextFieldProps & {
  icon?: ReactNode;
};

export function AuthTextField({ icon, InputProps, ...props }: AuthTextFieldProps) {
  return (
    <TextField
      fullWidth
      {...props}
      InputProps={{
        ...InputProps,
        startAdornment: icon ? (
          <InputAdornment position="start">
            {icon}
          </InputAdornment>
        ) : InputProps?.startAdornment
      }}
      variant="outlined"
    />
  );
}
