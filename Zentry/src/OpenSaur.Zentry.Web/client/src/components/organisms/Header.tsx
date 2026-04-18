import { Menu } from "lucide-react";
import {
  AppBar,
  IconButton,
  Stack,
  Toolbar
} from "@mui/material";
import { EyebrowText } from "../atoms/EyebrowText";
import { AppIcon } from "../icons/AppIcon";
import { mockProfile } from "../../mocks/profile";
import { layoutStyles } from "../../theme/theme";
import { UserProfileMenu } from "./UserProfileMenu";

type AppHeaderProps = {
  isDesktop: boolean;
  onOpenNavigation: () => void;
};

export function Header({ isDesktop, onOpenNavigation }: AppHeaderProps) {
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
            spacing={2}
            sx={{ minWidth: 0 }}
          >
            <EyebrowText>
              Protected workspace
            </EyebrowText>
          </Stack>
        </Stack>
        <UserProfileMenu profile={mockProfile} />
      </Toolbar>
    </AppBar>
  );
}
