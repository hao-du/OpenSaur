import type { PropsWithChildren, ReactNode } from "react";
import { Box, Stack } from "@mui/material";
import { BodyText } from "../atoms/BodyText";
import { PageTitleText } from "../atoms/PageTitleText";
import { layoutStyles } from "../../infrastructure/theme/theme";

type MainContentProps = PropsWithChildren<{
  headerActions?: ReactNode;
  subtitle?: string;
  title: string;
}>;

export function MainContent({ children, headerActions, subtitle, title }: MainContentProps) {
  return (
    <Box
      component="main"
      sx={layoutStyles.mainContent}
    >
      <Stack spacing={2}>
        <Stack
          alignItems={{ md: "center", xs: "flex-start" }}
          direction={{ md: "row", xs: "column" }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <PageTitleText as="h1" variant="h3">{title}</PageTitleText>
          {headerActions}
        </Stack>
        {subtitle ? (
          <BodyText>
            {subtitle}
          </BodyText>
        ) : null}
        {children}
      </Stack>
    </Box>
  );
}
