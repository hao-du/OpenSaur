import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton
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
import { useSettings } from "../../features/settings/provider/SettingProvider";
import type { TranslationKey } from "../../features/settings/provider/translations";

const navigationIcons: Record<string, LucideIcon> = {
  "building-2": Building2,
  dashboard: LayoutDashboard,
  "key-round": KeyRound,
  shield: Shield,
  "user-round": UserRound
};

const navigationLabelKeys: Record<string, TranslationKey> = {
  "/": "nav.dashboard",
  "/oidc-clients": "nav.oidcClients",
  "/roles": "nav.roles",
  "/settings": "nav.settings",
  "/users": "nav.users",
  "/workspaces": "nav.workspaces"
};

type SideMenuProps = {
  currentYear: number;
};

export function SideMenu({ currentYear }: SideMenuProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: currentProfile, isLoading: isCurrentProfileLoading } = useCurrentProfileQuery();
  const { t } = useSettings();
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
        aria-label={t("nav.primaryNavigation")}
        component="nav"
        sx={layoutStyles.navList}
      >
        {isCurrentProfileLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <ListItemButton
              disabled
              key={`navigation-skeleton-${index}`}
              sx={layoutStyles.navItem}
            >
              <ListItemIcon sx={layoutStyles.navItemIcon}>
                <Skeleton height={22} variant="circular" width={22} />
              </ListItemIcon>
              <Skeleton height={24} variant="text" width={index === 1 ? 132 : 104} />
            </ListItemButton>
          ))
        ) : navigationItems.map(item => {
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
              <ListItemText primary={navigationLabelKeys[item.path] ? t(navigationLabelKeys[item.path]) : item.label} />
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
