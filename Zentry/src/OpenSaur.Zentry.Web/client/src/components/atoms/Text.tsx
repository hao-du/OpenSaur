import { useState } from "react";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Controller, type Control, type FieldPath, type FieldValues, type RegisterOptions } from "react-hook-form";

type TextProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  disabled?: boolean;
  helperText?: string;
  label: string;
  name: FieldPath<TFieldValues>;
  required?: boolean;
  rules?: Omit<RegisterOptions<TFieldValues, FieldPath<TFieldValues>>, "disabled" | "valueAsDate" | "valueAsNumber" | "setValueAs">;
  shouldUnregister?: boolean;
  showPasswordToggle?: boolean;
  type?: string;
};

export function Text<TFieldValues extends FieldValues>({
  control,
  disabled = false,
  helperText,
  label,
  name,
  required = false,
  rules,
  shouldUnregister = false,
  showPasswordToggle = true,
  type = "text"
}: TextProps<TFieldValues>) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password";
  const effectiveType = isPasswordField && showPassword ? "text" : type;

  return (
    <Controller
      control={control}
      name={name}
      shouldUnregister={shouldUnregister}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          disabled={disabled}
          error={fieldState.error != null}
          fullWidth
          helperText={fieldState.error?.message ?? helperText}
          label={label}
          required={required}
          type={effectiveType}
          slotProps={
            isPasswordField && showPasswordToggle
              ? {
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          edge="end"
                          onClick={() => setShowPassword((prev) => !prev)}
                          onMouseDown={(e) => e.preventDefault()}
                          size="small"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }
              : undefined
          }
        />
      )}
      rules={rules}
    />
  );
}
