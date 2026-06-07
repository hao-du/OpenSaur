import { Chip } from "@mui/material";

type BooleanChipProps = {
  falseLabel: string;
  trueLabel: string;
  value: boolean;
};

export function BooleanChip({ falseLabel, trueLabel, value }: BooleanChipProps) {
  if (value) {
    return (
      <Chip
        label={trueLabel}
        size="small"
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
        }}
      />
    );
  }

  return <Chip label={falseLabel} size="small" variant="outlined" />;
}
