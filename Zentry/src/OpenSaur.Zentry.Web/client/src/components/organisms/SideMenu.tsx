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
  UserRound,
  type LucideIcon
} from "lucide-react";
import { EyebrowText } from "../atoms/EyebrowText";
import { MetaText } from "../atoms/MetaText";
import { AppIcon } from "../icons/AppIcon";
import { layoutStyles } from "../../infrastructure/theme/theme";
import { useCurrentProfileQuery } from "../../features/profile/hooks/useCurrentProfileQuery";

const navigationIcons: Record<string, LucideIcon> = {
  "building-2": Building2,
  dashboard: LayoutDashboard,
  "key-round": KeyRound,
  shield: Shield,
  "user-round": UserRound
};

type SideMenuProps = {
  currentYear: number;
};

export function SideMenu({ currentYear }: SideMenuProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: currentProfile } = useCurrentProfileQuery();
  const navigationItems = currentProfile?.navigationItems ?? [];

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
          const Icon = navigationIcons[item.icon] ?? LayoutDashboard;

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
