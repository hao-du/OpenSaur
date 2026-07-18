import { useMemo, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Settings,
  UserRound
} from "lucide-react";
import {
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  Stack
} from "@mui/material";
import { LabelText } from "../atoms/LabelText";
import { MetaText } from "../atoms/MetaText";
import { AppIcon } from "../icons/AppIcon";
import { Avatar } from "./Avatar";
import type { CurrentProfileDto } from "../../features/profile/dtos/CurrentProfileDto";
import { useAuthSession } from "../../features/auth/hooks/AuthContext";
import { layoutStyles } from "../../infrastructure/theme/theme";
import { useSettings } from "../../features/settings/provider/SettingProvider";

type UserProfileMenuProps = {
  isLoading?: boolean;
  profile?: CurrentProfileDto;
  showMenuItems?: boolean;
};

export function UserProfileMenu({ isLoading = false, profile, showMenuItems = true }: UserProfileMenuProps) {
  const { authSession, handleLogout } = useAuthSession();
  const { t } = useSettings();
  const navigate = useNavigate();
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const displayName = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() || t("profile.userInittials");
  const initials = useMemo(() => {
    const segments = displayName.split(/\s+/).filter(Boolean);
    if (segments.length === 0) {
      return "ZT";
    }

    if (segments.length === 1) {
      return segments[0].slice(0, 2).toUpperCase();
    }

    return segments
      .slice(0, 2)
      .map(segment => segment[0])
      .join("")
      .toUpperCase();
  }, [displayName]);

  function handleOpenMenu(event: MouseEvent<HTMLElement>) {
    setAnchorElement(event.currentTarget);
  }

  function handleCloseMenu() {
    setAnchorElement(null);
  }

  return (
    <>
      <IconButton
        aria-label={t("nav.openAccountMenu")}
        disabled={isLoading}
        onClick={handleOpenMenu}
        size="small"
      >
        {isLoading ? (
          <Skeleton height={40} variant="circular" width={40} />
        ) : (
          <Avatar initials={initials} />
        )}
      </IconButton>
      <Menu
        anchorEl={anchorElement}
        onClose={handleCloseMenu}
        open={anchorElement !== null}
      >
        <Box sx={layoutStyles.menuProfileContent}>
          <Stack spacing={0.25}>
            <LabelText>
              {displayName}
            </LabelText>
            {profile?.userName ? (
              <MetaText>
                {profile.userName}
              </MetaText>
            ) : null}
            {profile?.email ? (
              <MetaText>
                {profile.email}
              </MetaText>
            ) : null}
          </Stack>
        </Box>
        {showMenuItems ? (
          <>
            <Divider />
            <Box sx={layoutStyles.menuActionGroup}>
              <MenuItem onClick={() => {
                handleCloseMenu();
                navigate("/profile");
              }}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <AppIcon icon={UserRound} />
                  <span>{t("profile.myProfile")}</span>
                </Stack>
              </MenuItem>
              <MenuItem onClick={() => {
                handleCloseMenu();
                navigate("/settings");
              }}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <AppIcon icon={Settings} />
                  <span>{t("nav.settings")}</span>
                </Stack>
              </MenuItem>
            </Box>
            {authSession != null ? <Divider /> : null}
          </>
        ) : null}
        {authSession != null ? (
          <MenuItem onClick={() => {
            handleCloseMenu();
            handleLogout();
          }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center" }}
            >
              <AppIcon icon={LogOut} />
              <span>{t("profile.logout")}</span>
            </Stack>
          </MenuItem>
        ) : null}
      </Menu>
    </>
  );
}
