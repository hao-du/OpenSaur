import type { PropsWithChildren } from "react";
import { Box, Stack } from "@mui/material";
import { BodyText } from "../atoms/BodyText";
import { PageTitleText } from "../atoms/PageTitleText";
import { layoutStyles } from "../../infrastructure/theme/theme";

type MainContentProps = PropsWithChildren<{
  subtitle?: string;
  title: string;
}>;

export function MainContent({ children, subtitle, title }: MainContentProps) {
  return (
    <Box
      component="main"
      sx={layoutStyles.mainContent}
    >
      <Stack spacing={2}>
        <Stack spacing={2}>
          <PageTitleText
            as="h1"
            variant="h3"
          >
            {title}
          </PageTitleText>
          {subtitle ? (
            <BodyText>
              {subtitle}
            </BodyText>
          ) : null}
        </Stack>
        {children}
      </Stack>
    </Box>
  );
}
