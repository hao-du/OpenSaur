import { useMemo, useState, type MouseEvent } from "react";
import ExitToAppRoundedIcon from "@mui/icons-material/ExitToAppRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
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
import { Avatar } from "./Avatar";
import type { MockProfile } from "../../mocks/profile";

type UserProfileMenuProps = {
  profile: MockProfile;
};

export function UserProfileMenu({ profile }: UserProfileMenuProps) {
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
        <MenuItem onClick={handleCloseMenu}>
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
          >
            <PersonOutlineRoundedIcon fontSize="small" />
            <span>My Profile</span>
          </Stack>
        </MenuItem>
        <MenuItem onClick={handleCloseMenu}>
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
          >
            <KeyRoundedIcon fontSize="small" />
            <span>Change password</span>
          </Stack>
        </MenuItem>
        <MenuItem onClick={handleCloseMenu}>
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
          >
            <SettingsRoundedIcon fontSize="small" />
            <span>Settings</span>
          </Stack>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleCloseMenu}>
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
          >
            <ExitToAppRoundedIcon fontSize="small" />
            <span>Logout</span>
          </Stack>
        </MenuItem>
      </Menu>
    </>
  );
}
