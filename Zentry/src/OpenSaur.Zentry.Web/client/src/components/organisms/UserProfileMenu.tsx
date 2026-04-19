import { useMemo, useState, type MouseEvent } from "react";
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
  Stack
} from "@mui/material";
import { LabelText } from "../atoms/LabelText";
import { MetaText } from "../atoms/MetaText";
import { AppIcon } from "../icons/AppIcon";
import { Avatar } from "./Avatar";
import type { MockProfile } from "../../mocks/profile";
import { useAuthSession } from "../../features/auth/hooks/AuthContext";

type UserProfileMenuProps = {
  profile: MockProfile;
};

export function UserProfileMenu({ profile }: UserProfileMenuProps) {
  const { handleLogout } = useAuthSession();
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const displayName = `${profile.firstName} ${profile.lastName}`.trim();
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
        aria-label="Open account menu"
        onClick={handleOpenMenu}
        size="small"
      >
        <Avatar initials={initials} />
      </IconButton>
      <Menu
        anchorEl={anchorElement}
        onClose={handleCloseMenu}
        open={anchorElement !== null}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Stack spacing={0.25}>
            <LabelText>
              {displayName}
            </LabelText>
            <MetaText>
              {profile.email}
            </MetaText>
          </Stack>
        </Box>
        <Divider />
        <MenuItem onClick={() => {
          handleCloseMenu();
        }}>
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
          >
            <AppIcon icon={UserRound} />
            <span>My Profile</span>
          </Stack>
        </MenuItem>
        <MenuItem onClick={handleCloseMenu}>
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
          >
            <AppIcon icon={KeyRound} />
            <span>Change password</span>
          </Stack>
        </MenuItem>
        <MenuItem onClick={handleCloseMenu}>
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
          >
            <AppIcon icon={Settings} />
            <span>Settings</span>
          </Stack>
        </MenuItem>
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
            <span>Logout</span>
          </Stack>
        </MenuItem>
      </Menu>
    </>
  );
}
