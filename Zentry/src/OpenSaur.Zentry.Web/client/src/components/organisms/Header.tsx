import { Eye, Menu } from "lucide-react";
import {
  AppBar,
  Box,
  IconButton,
  Stack,
  Tooltip,
  Toolbar
} from "@mui/material";
import { EyebrowText } from "../atoms/EyebrowText";
import { AppIcon } from "../icons/AppIcon";
import { layoutStyles } from "../../infrastructure/theme/theme";
import { useCurrentProfileQuery } from "../../features/profile/hooks/useCurrentProfileQuery";
import { UserProfileMenu } from "./UserProfileMenu";

type AppHeaderProps = {
  isDesktop: boolean;
  onOpenNavigation: () => void;
};

export function Header({ isDesktop, onOpenNavigation }: AppHeaderProps) {
  const { data: currentProfile } = useCurrentProfileQuery();
  const workspaceName = currentProfile?.workspaceName ?? "Protected workspace";

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
              aria-label="Open navigation"
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
            <EyebrowText>
              {workspaceName}
            </EyebrowText>
            {currentProfile?.isImpersonating ? (
              <Tooltip title="Impersonation mode">
                <Box component="span" sx={layoutStyles.impersonationIndicator}>
                  <AppIcon icon={Eye} size={16} />
                </Box>
              </Tooltip>
            ) : null}
          </Stack>
        </Stack>
        <UserProfileMenu
          profile={currentProfile}
        />
      </Toolbar>
    </AppBar>
  );
}
