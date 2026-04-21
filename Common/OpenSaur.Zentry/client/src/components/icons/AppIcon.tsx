import type { LucideIcon } from "lucide-react";

type AppIconProps = {
  icon: LucideIcon;
  size?: number;
  strokeWidth?: number;
};

export function AppIcon({
  icon: Icon,
  size = 18,
  strokeWidth = 2
}: AppIconProps) {
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
    />
  );
}

export type { LucideIcon as AppIconType } from "lucide-react";
