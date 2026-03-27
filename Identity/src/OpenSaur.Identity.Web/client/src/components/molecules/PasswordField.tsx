import * as React from "react";
import { IconButton, InputAdornment } from "@mui/material";
import { Eye, EyeOff, KeyRound } from "../../shared/icons";
import { AuthTextField } from "../atoms";

type PasswordFieldProps = {
  autoComplete?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  label: string;
  name: string;
  onBlur?: () => void;
  onChange: (value: string) => void;
  value: string;
};

export function PasswordField({
  autoComplete,
  disabled,
  error,
  helperText,
  label,
  name,
  onBlur,
  onChange,
  value
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <AuthTextField
      autoComplete={autoComplete}
      disabled={disabled}
      error={error}
      helperText={helperText}
      icon={<KeyRound size={18} />}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label={isVisible ? "Hide password" : "Show password"}
              edge="end"
              onClick={() => {
                setIsVisible(currentValue => !currentValue);
              }}
            >
              {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </IconButton>
          </InputAdornment>
        )
      }}
      label={label}
      name={name}
      onBlur={onBlur}
      onChange={event => {
        onChange(event.target.value);
      }}
      type={isVisible ? "text" : "password"}
      value={value}
    />
  );
}
