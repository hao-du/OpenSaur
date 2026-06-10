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
  Coins,
  LayoutDashboard,
  LayoutTemplate,
  ReceiptText,
  Tag,
  Shield,
  UserRound,
  Users,
  type LucideIcon
} from "lucide-react";
import { Stack } from "@mui/material";
import { EyebrowText } from "../atoms/EyebrowText";
import { MetaText } from "../atoms/MetaText";
import { AppIcon } from "../icons/AppIcon";
import { layoutStyles } from "../../infrastructure/theme/theme";
import { useCurrentProfileQuery } from "../../features/profile/hooks/useCurrentProfileQuery";
import { useSettings } from "../../features/settings/provider/SettingProvider";
import type { TranslationKey } from "../../features/settings/provider/translations";

const navigationIcons: Record<string, LucideIcon> = {
  "building-2": Building2,
  coins: Coins,
  dashboard: LayoutDashboard,
  "key-round": Tag,
  "receipt-text": ReceiptText,
  "layout-template": LayoutTemplate,
  shield: Shield,
  "user-round": UserRound,
  users: Users
};

const navigationLabelKeys: Record<string, TranslationKey> = {
  "/": "nav.dashboard",
  "/banks": "nav.banks",
  "/counterparties": "nav.counterparties",
  "/currencies": "nav.currencies",
  "/transactions": "nav.transactions",
  "/templates": "nav.templates",
  "/tags": "nav.tags",
};

const navigationGroups = [
  {
    labelKey: null,
    paths: ["/", "/transactions"],
  },
  {
    labelKey: "nav.group.setup",
    paths: ["/templates", "/tags"],
  },
  {
    labelKey: "nav.group.masterData",
    paths: ["/banks", "/currencies", "/counterparties"],
  }
] as const;

type SideMenuProps = {
  currentYear: number;
};

export function SideMenu({ currentYear }: SideMenuProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: currentProfile, isLoading: isCurrentProfileLoading } = useCurrentProfileQuery();
  const { t } = useSettings();
  const navigationItems = currentProfile?.navigationItems ?? [];
  const navigationItemsByPath = new Map(navigationItems.map(item => [item.path, item]));
  const groupedPaths = new Set<string>(navigationGroups.flatMap(group => group.paths));
  const remainingItems = navigationItems.filter(item => !groupedPaths.has(item.path));

  const renderNavigationItem = (item: typeof navigationItems[number]) => {
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
  };

  return (
    <Box sx={layoutStyles.sidebarContainer}>
      <Box sx={layoutStyles.sidebarBrandRow}>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
          <Box
            alt="CashPilot"
            component="img"
            src="/logo.svg"
            sx={{
              display: "block",
              height: 34,
              width: 34
            }}
          />
          <EyebrowText
            sx={{
              fontSize: "0.95rem",
              letterSpacing: "0.14em"
            }}
          >
            CashPilot
          </EyebrowText>
        </Box>
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
        ) : (
          <Stack spacing={1.5}>
            {navigationGroups.map(group => {
              const items = group.paths
                .map(path => navigationItemsByPath.get(path))
                .filter((item): item is typeof navigationItems[number] => item != null);

              if (items.length === 0) {
                return null;
              }

              return (
                <Box key={group.labelKey}>
                  {group.labelKey != null ? (
                    <MetaText sx={{ px: 2, py: 0.5 }}>
                      {t(group.labelKey)}
                    </MetaText>
                  ) : null}
                  {items.map(renderNavigationItem)}
                </Box>
              );
            })}
            {remainingItems.length > 0 ? (
              <Box>
                <MetaText sx={{ px: 2, py: 0.5 }}>
                  {t("nav.group.other")}
                </MetaText>
                {remainingItems.map(renderNavigationItem)}
              </Box>
            ) : null}
          </Stack>
        )}
      </List>
      <Box sx={layoutStyles.flexGrow} />
      <Divider sx={layoutStyles.fullWidthDividerSpacing} />
      <MetaText>
        {`Copyright © ${currentYear} CashPilot.`}
      </MetaText>
    </Box>
  );
}




