import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";
import type { SvgIconComponent } from "@mui/icons-material";

export type NavigationItem = {
  icon: SvgIconComponent;
  label: string;
  path: string;
};

export const navigationItems: NavigationItem[] = [
  {
    icon: DashboardRoundedIcon,
    label: "Dashboard",
    path: "/"
  },
  {
    icon: VpnKeyRoundedIcon,
    label: "Applications",
    path: "/applications"
  },
  {
    icon: ApartmentRoundedIcon,
    label: "Workspaces",
    path: "/workspaces"
  },
  {
    icon: BadgeRoundedIcon,
    label: "Users",
    path: "/users"
  },
  {
    icon: ShieldRoundedIcon,
    label: "Roles",
    path: "/roles"
  }
];
