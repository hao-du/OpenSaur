import { createContext, useContext, type FormEventHandler, type ReactNode } from "react";
import { Alert, Divider, Drawer as MuiDrawer, IconButton, Stack, type SxProps, type Theme } from "@mui/material";
import { X } from "lucide-react";
import { BodyText } from "../atoms/BodyText";
import { PageTitleText } from "../atoms/PageTitleText";
import { AppIcon } from "../icons/AppIcon";
import { useSettings } from "../../features/settings/provider/SettingProvider";
import { drawerPaperWidths } from "../../infrastructure/theme/theme";

type DrawerWidth = "narrow" | "wide";

type DrawerContextValue = {
  onClose: () => void;
  subtitle?: ReactNode;
  title: ReactNode;
  titleAction?: ReactNode;
};

const DrawerContext = createContext<DrawerContextValue | null>(null);

type DrawerProps = DrawerContextValue & {
  children: ReactNode;
  isOpen: boolean;
  width?: DrawerWidth;
};

export function Drawer({
  children,
  isOpen,
  onClose,
  subtitle,
  title,
  titleAction,
  width = "narrow",
}: DrawerProps) {
  const paperWidth = width === "wide" ? drawerPaperWidths.wide : drawerPaperWidths.narrow;

  return (
    <DrawerContext.Provider value={{ onClose, subtitle, title, titleAction }}>
      <MuiDrawer
        anchor="right"
        open={isOpen}
        onClose={onClose}
        sx={{
          "& .MuiDrawer-paper": {
            display: "flex",
            flexDirection: "column",
            height: "100%",
            p: 0,
            width: paperWidth,
          },
        }}
      >
        <Stack sx={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0 }}>
          {children}
        </Stack>
      </MuiDrawer>
    </DrawerContext.Provider>
  );
}

function useDrawerContext() {
  const context = useContext(DrawerContext);
  if (context == null) {
    throw new Error("Drawer slots must be used within Drawer.");
  }

  return context;
}

type DrawerHeaderProps = {
  sx?: SxProps<Theme>;
};

export function DrawerHeader({ sx }: DrawerHeaderProps) {
  const { t } = useSettings();
  const { onClose, subtitle, title, titleAction } = useDrawerContext();

  return (
    <>
      <Stack
        direction="row"
        sx={[
          {
            height: 64,
            minHeight: 64,
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
          },
          ...(Array.isArray(sx) ? sx : sx != null ? [sx] : []),
        ]}
      >
        <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0, pr: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
            <PageTitleText
              as="h2"
              variant="h5"
              sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {title}
            </PageTitleText>
            {titleAction}
          </Stack>
          {subtitle ? <BodyText>{subtitle}</BodyText> : null}
        </Stack>
        <IconButton aria-label={t("action.cancel")} onClick={onClose}>
          <AppIcon icon={X} />
        </IconButton>
      </Stack>
      <Divider />
    </>
  );
}

type DrawerBodyProps = {
  children: ReactNode;
  errorMessage?: ReactNode;
  component?: "div" | "form";
  id?: string;
  noValidate?: boolean;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  sx?: SxProps<Theme>;
};

export function DrawerBody({ children, errorMessage, component = "div", id, noValidate, onSubmit, sx }: DrawerBodyProps) {
  return (
    <Stack
      component={component}
      id={id}
      noValidate={noValidate}
      onSubmit={onSubmit}
      sx={[
        {
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          p: 3,
        },
        ...(Array.isArray(sx) ? sx : sx != null ? [sx] : []),
      ]}
    >
      {errorMessage != null ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      ) : null}
      {children}
    </Stack>
  );
}

type DrawerFooterProps = {
  actions: ReactNode[];
  sx?: SxProps<Theme>;
};

export function DrawerFooter({ actions, sx }: DrawerFooterProps) {
  return (
    <>
      <Divider />
      <Stack
        direction="row"
        sx={[
          {
            px: 3,
            py: 2,
            justifyContent: "flex-end",
          },
          ...(Array.isArray(sx) ? sx : sx != null ? [sx] : []),
        ]}
      >
        {actions.length > 0 ? (
          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
            {actions}
          </Stack>
        ) : null}
      </Stack>
    </>
  );
}
