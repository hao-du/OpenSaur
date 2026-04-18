import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import { EyebrowText } from "../atoms/EyebrowText";
import { MetaText } from "../atoms/MetaText";
import { navigationItems } from "../shell/navigation";
import { layoutStyles } from "../../theme/theme";

type SideMenuProps = {
  currentYear: number;
};

export function SideMenu({ currentYear }: SideMenuProps) {
  return (
    <Box sx={layoutStyles.sidebarContainer}>
      <Box sx={layoutStyles.sidebarBrandRow}>
        <EyebrowText
          sx={{
            fontSize: "2rem",
            letterSpacing: "0.08em"
          }}
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
              sx={layoutStyles.navItem}
            >
              <ListItemIcon sx={layoutStyles.navItemIcon}>
                <Icon fontSize="small" />
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
