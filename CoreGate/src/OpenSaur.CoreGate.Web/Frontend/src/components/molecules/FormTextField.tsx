import { IconButton, InputAdornment, TextField } from "@mui/material";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Controller, type Control, type FieldPath, type FieldValues, type RegisterOptions } from "react-hook-form";

type FormTextFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  rules?: RegisterOptions<TFieldValues, FieldPath<TFieldValues>>;
  type?: string;
  autoComplete?: string;
  showPasswordToggle?: boolean;
};

export function FormTextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  rules,
  type,
  autoComplete,
  showPasswordToggle = true
}: FormTextFieldProps<TFieldValues>) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password";
  const resolvedType = isPasswordField ? (showPassword ? "text" : "password") : type;

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          slotProps={{
            formHelperText: {
              sx: {
                mt: 1,
                mx: 0
              }
            },
            input: isPasswordField && showPasswordToggle
              ? {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={handleTogglePassword}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              : undefined
          }}
          label={label}
          type={resolvedType}
          autoComplete={autoComplete}
          error={fieldState.invalid}
          helperText={fieldState.error?.message}
          fullWidth
        />
      )}
    />
  );
}
