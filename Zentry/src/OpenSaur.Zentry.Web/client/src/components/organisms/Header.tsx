import { Eye, Menu } from "lucide-react";
import {
  AppBar,
  Box,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Toolbar
} from "@mui/material";
import { EyebrowText } from "../atoms/EyebrowText";
import { AppIcon } from "../icons/AppIcon";
import { layoutStyles } from "../../infrastructure/theme/theme";
import { useCurrentProfileQuery } from "../../features/profile/hooks/useCurrentProfileQuery";
import { useSettings } from "../../features/settings/provider/SettingProvider";
import { UserProfileMenu } from "./UserProfileMenu";

type AppHeaderProps = {
  isDesktop: boolean;
  onOpenNavigation: () => void;
};

export function Header({ isDesktop, onOpenNavigation }: AppHeaderProps) {
  const { data: currentProfile, isLoading: isCurrentProfileLoading } = useCurrentProfileQuery();
  const { t } = useSettings();
  const workspaceName = currentProfile?.workspaceName ?? t("nav.protectedWorkspace");

  return (
    <AppBar
      color="transparent"
      elevation={0}
      position="sticky"
      sx={layoutStyles.headerBar}
    >
      <Toolbar
        disableGutters
        sx={layoutStyles.headerToolbar}
      >
        <Stack
          alignItems="center"
          direction="row"
          spacing={2}
        >
          {!isDesktop ? (
            <IconButton
              aria-label={t("nav.openNavigation")}
              edge="start"
              onClick={onOpenNavigation}
            >
              <AppIcon icon={Menu} />
            </IconButton>
          ) : null}
          <Stack
            alignItems="center"
            direction="row"
            spacing={2}
            sx={layoutStyles.sideMenuHeaderMeta}
          >
            {isCurrentProfileLoading ? (
              <Skeleton height={20} variant="text" width={160} />
            ) : (
              <EyebrowText>
                {workspaceName}
              </EyebrowText>
            )}
            {isCurrentProfileLoading ? (
              <Skeleton height={24} variant="circular" width={24} />
            ) : currentProfile?.isImpersonating ? (
              <Tooltip title={t("nav.impersonationMode")}>
                <Box component="span" sx={layoutStyles.impersonationIndicator}>
                  <AppIcon icon={Eye} size={16} />
                </Box>
              </Tooltip>
            ) : null}
          </Stack>
        </Stack>
        <UserProfileMenu
          isLoading={isCurrentProfileLoading}
          profile={currentProfile}
        />
      </Toolbar>
    </AppBar>
  );
}
