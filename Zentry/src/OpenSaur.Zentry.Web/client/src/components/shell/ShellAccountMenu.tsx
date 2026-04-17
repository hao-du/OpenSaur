import { useMemo, useState, type MouseEvent } from "react";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography
} from "@mui/material";

type ShellAccountMenuProps = {
  email?: string;
  onLogout: () => void;
  userName?: string;
};

function getInitials(userName?: string) {
  if (!userName) {
    return "ZE";
  }

  return userName.slice(0, 2).toUpperCase();
}

export function ShellAccountMenu({
  email,
  onLogout,
  userName
}: ShellAccountMenuProps) {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const initials = useMemo(() => getInitials(userName), [userName]);

  function handleOpen(event: MouseEvent<HTMLElement>) {
    setAnchorElement(event.currentTarget);
  }

  function handleClose() {
    setAnchorElement(null);
  }

  function handleLogout() {
    handleClose();
    onLogout();
  }

  return (
    <>
      <IconButton aria-label="Open account menu" onClick={handleOpen}>
        <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}>
          {initials}
        </Avatar>
      </IconButton>
      <Menu anchorEl={anchorElement} onClose={handleClose} open={anchorElement !== null}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Stack spacing={0.25}>
            <Typography sx={{ fontWeight: 600 }}>
              {userName ?? "Authenticated user"}
            </Typography>
            {email ? (
              <Typography color="text.secondary" variant="body2">
                {email}
              </Typography>
            ) : null}
          </Stack>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout}>Log out</MenuItem>
      </Menu>
    </>
  );
}
