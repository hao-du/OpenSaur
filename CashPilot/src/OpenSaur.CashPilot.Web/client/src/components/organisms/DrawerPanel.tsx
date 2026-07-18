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
  titleAction?: ReactNode;
  title: ReactNode;
  width?: "narrow" | "wide";
};

export function DrawerPanel({
  children,
  isOpen,
  onClose,
  subtitle,
  titleAction,
  title,
  width = "narrow"
}: DrawerPanelProps) {
  const { t } = useSettings();
  const drawerStyle = width === "wide" ? layoutStyles.drawerPaperWide : layoutStyles.drawerPaperNarrow;

  return (
    <Drawer anchor="right" open={isOpen} sx={drawerStyle}>
      <Stack sx={layoutStyles.drawerContent}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", height: "64px", minHeight: "64px", px: 2 }}
        >
          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0, pr: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
              <PageTitleText
                as="h2"
                variant="h5"
                sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {title}
              </PageTitleText>
              {titleAction}
            </Stack>
            {subtitle ? <BodyText>{subtitle}</BodyText> : null}
          </Stack>
          <IconButton aria-label={t("action.cancel")} onClick={onClose}>
            <X size={18} />
          </IconButton>
        </Stack>
        <Divider />
        <Stack sx={{ p: 3 }}>
          {children}
        </Stack>
      </Stack>
    </Drawer>
  );
}
