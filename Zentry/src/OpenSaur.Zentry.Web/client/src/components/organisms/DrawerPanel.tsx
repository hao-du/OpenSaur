import type { ReactNode } from "react";
import { Divider, Drawer, IconButton, Stack, Typography } from "@mui/material";
import { X } from "lucide-react";
import { layoutStyles } from "../../infrastructure/theme/theme";

type DrawerPanelProps = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  subtitle?: ReactNode;
  title: ReactNode;
  width?: "narrow" | "wide";
};

export function DrawerPanel({
  children,
  isOpen,
  onClose,
  subtitle,
  title,
  width = "narrow"
}: DrawerPanelProps) {
  const drawerStyle = width === "wide" ? layoutStyles.drawerPaperWide : layoutStyles.drawerPaperNarrow;

  return (
    <Drawer anchor="right" open={isOpen} sx={drawerStyle}>
      <Stack spacing={3} sx={layoutStyles.drawerContent}>
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography component="h2" variant="h5">
              {title}
            </Typography>
            {subtitle ? <Typography color="text.secondary">{subtitle}</Typography> : null}
          </Stack>
          <IconButton aria-label="Close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </Stack>
        <Divider />
        {children}
      </Stack>
    </Drawer>
  );
}
