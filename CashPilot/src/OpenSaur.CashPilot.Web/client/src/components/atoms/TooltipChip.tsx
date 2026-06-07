import { Chip, Tooltip, type ChipProps } from "@mui/material";
import type { ReactNode } from "react";

type TooltipChipProps = Omit<ChipProps, "label"> & {
  label: ReactNode;
  tooltipItems?: string[];
  tooltipTitle?: ReactNode;
};

export function TooltipChip({
  tooltipItems,
  tooltipTitle,
  ...chipProps
}: TooltipChipProps) {
  const title =
    tooltipTitle ??
    (tooltipItems != null && tooltipItems.length > 0
      ? tooltipItems.join(", ")
      : "");

  const chip = <Chip {...chipProps} />;

  if (title === "") {
    return chip;
  }

  return (
    <Tooltip arrow title={title}>
      {chip}
    </Tooltip>
  );
}
