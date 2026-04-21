import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  KeyRound,
  LayoutDashboard,
  Shield,
  UserRound
} from "lucide-react";
import { EyebrowText } from "../atoms/EyebrowText";
import { MetaText } from "../atoms/MetaText";
import { AppIcon, type AppIconType } from "../icons/AppIcon";
import { layoutStyles } from "../../infrastructure/theme/theme";

type NavigationItem = {
  icon: AppIconType;
  label: string;
  path: string;
};

const navigationItems: NavigationItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/"
  },
  {
    icon: KeyRound,
    label: "OIDC Clients",
    path: "/oidc-clients"
  },
  {
    icon: Building2,
    label: "Workspaces",
    path: "/workspaces"
  },
  {
    icon: UserRound,
    label: "Users",
    path: "/users"
  },
  {
    icon: Shield,
    label: "Roles",
    path: "/roles"
  }
];

type SideMenuProps = {
  currentYear: number;
};

export function SideMenu({ currentYear }: SideMenuProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box sx={layoutStyles.sidebarContainer}>
      <Box sx={layoutStyles.sidebarBrandRow}>
        <EyebrowText
          sx={layoutStyles.sidebarBrandText}
        >
          Zentry
        </EyebrowText>
      </Box>
      <Divider sx={layoutStyles.fullWidthDivider} />
      <List
        aria-label="Primary navigation"
        component="nav"
        sx={layoutStyles.navList}
      >
        {navigationItems.map(item => {
          const Icon = item.icon;

          return (
            <ListItemButton
              key={item.path}
              onClick={() => {
                navigate(item.path);
              }}
              selected={location.pathname === item.path}
              sx={layoutStyles.navItem}
            >
              <ListItemIcon sx={layoutStyles.navItemIcon}>
                <AppIcon icon={Icon} />
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={layoutStyles.flexGrow} />
      <Divider sx={layoutStyles.fullWidthDividerSpacing} />
      <MetaText>
        {`Zentry ${currentYear}`}
      </MetaText>
    </Box>
  );
}
