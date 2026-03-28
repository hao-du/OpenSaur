import { useState, type MouseEvent } from "react";
import {
  Avatar,
  CircularProgress,
  Divider,
  IconButton,
  Menu as MaterialMenu,
  MenuItem,
  Stack
} from "@mui/material";
import {
  KeyRound,
  LogOut,
  Settings,
  UserRound
} from "../../shared/icons";

type ShellAccountMenuProps = {
  isLoggingOut: boolean;
  onChangePassword: () => void;
  onLogout: () => void;
  userName?: string;
};

function getUserInitials(userName?: string) {
  if (!userName) {
    return "CU";
  }

  const segments = userName
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[\s._-]+/)
    .filter(Boolean);

  if (segments.length === 1) {
    return segments[0].slice(0, 2).toUpperCase();
  }

  return segments
    .slice(0, 2)
    .map(segment => segment[0])
    .join("")
    .toUpperCase();
}

export function ShellAccountMenu({
  isLoggingOut,
  onChangePassword,
  onLogout,
  userName
}: ShellAccountMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const accountInitials = getUserInitials(userName);

  function handleOpenMenu(event: MouseEvent<HTMLElement>) {
    setAnchor(event.currentTarget);
  }

  function handleCloseMenu() {
    setAnchor(null);
  }

  function handleChangePassword() {
    handleCloseMenu();
    onChangePassword();
  }

  function handleLogout() {
    handleCloseMenu();
    onLogout();
  }

  return (
    <>
      <IconButton
        aria-label="Open account menu"
        onClick={handleOpenMenu}
        size="small"
      >
        <Avatar
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            height: 40,
            width: 40
          }}
        >
          {accountInitials}
        </Avatar>
      </IconButton>
      <MaterialMenu
        anchorEl={anchor}
        onClose={handleCloseMenu}
        open={anchor !== null}
      >
        <MenuItem disabled>
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
          >
            <UserRound size={16} />
            <span>My Profile</span>
          </Stack>
        </MenuItem>
        <MenuItem onClick={handleChangePassword}>
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
          >
            <KeyRound size={16} />
            <span>Change password</span>
          </Stack>
        </MenuItem>
        <MenuItem disabled>
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
          >
            <Settings size={16} />
            <span>Settings</span>
          </Stack>
        </MenuItem>
        <Divider />
        <MenuItem
          disabled={isLoggingOut}
          onClick={handleLogout}
        >
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
          >
            {isLoggingOut ? <CircularProgress color="inherit" size={16} /> : <LogOut size={16} />}
            <span>{isLoggingOut ? "Signing out..." : "Logout"}</span>
          </Stack>
        </MenuItem>
      </MaterialMenu>
    </>
  );
}
