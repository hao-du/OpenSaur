import { FormControlLabel, Switch as MuiSwitch } from "@mui/material";

type SwitchProps = {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  size?: "small" | "medium";
};

export function Switch({ checked, disabled = false, label, onChange, size = "small" }: SwitchProps) {
  return (
    <FormControlLabel
      control={(
        <MuiSwitch
          checked={checked}
          disabled={disabled}
          onChange={event => {
            onChange(event.target.checked);
          }}
          size={size}
        />
      )}
      label={label}
      sx={{ m: 0 }}
    />
  );
}
