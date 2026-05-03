import { Avatar as MuiAvatar } from "@mui/material";
import { layoutStyles } from "../../infrastructure/theme/theme";

type AvatarProps = {
  initials?: string;
};

export function Avatar({ initials = "ZT" }: AvatarProps) {
  return (
    <MuiAvatar sx={layoutStyles.avatarButton}>
      {initials}
    </MuiAvatar>
  );
}
