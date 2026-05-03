import type { ReactNode } from "react";
import { Divider, Drawer, IconButton, Stack } from "@mui/material";
import { X } from "lucide-react";
import { BodyText } from "../atoms/BodyText";
import { PageTitleText } from "../atoms/PageTitleText";
import { layoutStyles } from "../../infrastructure/theme/theme";
import { useSettings } from "../../features/settings/provider/SettingProvider";

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
  const { t } = useSettings();
  const drawerStyle = width === "wide" ? layoutStyles.drawerPaperWide : layoutStyles.drawerPaperNarrow;

  return (
    <Drawer anchor="right" open={isOpen} sx={drawerStyle}>
      <Stack spacing={3} sx={layoutStyles.drawerContent}>
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <Stack spacing={0.5}>
            <PageTitleText as="h2" variant="h5">
              {title}
            </PageTitleText>
            {subtitle ? <BodyText>{subtitle}</BodyText> : null}
          </Stack>
          <IconButton aria-label={t("action.cancel")} onClick={onClose}>
            <X size={18} />
          </IconButton>
        </Stack>
        <Divider />
        {children}
      </Stack>
    </Drawer>
  );
}
