import { useMemo, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  KeyRound,
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
import { ConfirmationDialog } from "./ConfirmationDialog";
import type { CurrentProfileDto } from "../../features/profile/dtos/CurrentProfileDto";
import { useAuthSession } from "../../features/auth/hooks/AuthContext";
import { useRequirePasswordChange } from "../../features/profile/hooks/useRequirePasswordChange";
import { getConfig } from "../../infrastructure/config/Config";
import { layoutStyles } from "../../infrastructure/theme/theme";
import { useSettings } from "../../features/settings/provider/SettingProvider";

type UserProfileMenuProps = {
  isLoading?: boolean;
  profile?: CurrentProfileDto;
};

export function UserProfileMenu({ isLoading = false, profile }: UserProfileMenuProps) {
  const { handleLogout } = useAuthSession();
  const { t } = useSettings();
  const navigate = useNavigate();
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const { isUpdating: isRequiringPasswordChange, requirePasswordChange } = useRequirePasswordChange();
  const displayName = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() || t("profile.zentryUser");
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

  function handleNavigateToChangePassword() {
    handleCloseMenu();
    setIsChangePasswordDialogOpen(true);
  }

  async function handleConfirmChangePassword() {
    await requirePasswordChange();
    const changePasswordUrl = new URL("/change-password", getConfig().authority);
    changePasswordUrl.searchParams.set("returnUrl", window.location.href);
    window.location.assign(changePasswordUrl.toString());
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
        <Divider />
        <Box sx={layoutStyles.menuActionGroup}>
          <MenuItem onClick={() => {
            handleCloseMenu();
            navigate("/profile");
          }}>
            <Stack
              alignItems="center"
              direction="row"
              spacing={1}
            >
              <AppIcon icon={UserRound} />
              <span>{t("profile.myProfile")}</span>
            </Stack>
          </MenuItem>
          <MenuItem onClick={handleNavigateToChangePassword}>
            <Stack
              alignItems="center"
              direction="row"
              spacing={1}
            >
              <AppIcon icon={KeyRound} />
              <span>{t("profile.changePassword")}</span>
            </Stack>
          </MenuItem>
          <MenuItem onClick={() => {
            handleCloseMenu();
            navigate("/settings");
          }}>
            <Stack
              alignItems="center"
              direction="row"
              spacing={1}
            >
              <AppIcon icon={Settings} />
              <span>{t("nav.settings")}</span>
            </Stack>
          </MenuItem>
        </Box>
        <Divider />
        <MenuItem onClick={() => {
          handleCloseMenu();
          handleLogout();
        }}>
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
          >
            <AppIcon icon={LogOut} />
            <span>{t("profile.logout")}</span>
          </Stack>
        </MenuItem>
      </Menu>
      <ConfirmationDialog
        confirmLabel={t("action.ok")}
        isConfirming={isRequiringPasswordChange}
        message={t("profile.changePasswordConfirmMessage")}
        onClose={() => {
          if (isRequiringPasswordChange) {
            return;
          }

          setIsChangePasswordDialogOpen(false);
        }}
        onConfirm={() => {
          void handleConfirmChangePassword();
        }}
        open={isChangePasswordDialogOpen}
        title={t("profile.changePasswordConfirmTitle")}
      />
    </>
  );
}
