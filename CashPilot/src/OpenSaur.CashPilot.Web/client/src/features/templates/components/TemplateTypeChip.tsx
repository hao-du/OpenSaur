import { Chip } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

type Props = {
  label: string;
  templateType: number;
  sx?: SxProps<Theme>;
};

function getTemplateTypeChipSx(templateType: number): SxProps<Theme> {
  if (templateType === 1) {
    return {
      color: "var(--tx-type-cashflow-color)",
      borderColor: "var(--tx-type-cashflow-border)",
      backgroundColor: "var(--tx-type-cashflow-bg)",
      fontWeight: 500,
    };
  }

  if (templateType === 2) {
    return {
      color: "var(--tx-type-transfer-color)",
      borderColor: "var(--tx-type-transfer-border)",
      backgroundColor: "var(--tx-type-transfer-bg)",
      fontWeight: 500,
    };
  }

  if (templateType === 3) {
    return {
      color: "var(--tx-type-exchange-color)",
      borderColor: "var(--tx-type-exchange-border)",
      backgroundColor: "var(--tx-type-exchange-bg)",
      fontWeight: 500,
    };
  }

  return {
    color: "var(--tx-type-bankaccount-color)",
    borderColor: "var(--tx-type-bankaccount-border)",
    backgroundColor: "var(--tx-type-bankaccount-bg)",
    fontWeight: 500,
  };
}

export function TemplateTypeChip({ label, templateType, sx }: Props) {
  const sxItems = Array.isArray(sx) ? sx : [sx];

  return (
    <Chip
      label={label}
      size="small"
      variant="outlined"
      sx={[getTemplateTypeChipSx(templateType), ...sxItems]}
    />
  );
}
