import { CircularProgress, Paper, Stack } from "@mui/material";
import { BodyText } from "./BodyText";
import { PageTitleText } from "./PageTitleText";
import { loadingSpinnerSize } from "../../infrastructure/constants/uiSizes";
import { layoutStyles } from "../../infrastructure/theme/theme";

type ListStatePanelProps = {
  emptySubtitle: string;
  emptyTitle: string;
  loadingLabel: string;
  state: "empty" | "loading";
};

export function ListStatePanel({
  emptySubtitle,
  emptyTitle,
  loadingLabel,
  state,
}: ListStatePanelProps) {
  return (
    <Paper
      elevation={0}
      sx={state === "loading" ? layoutStyles.loadingPanel : layoutStyles.emptyStatePanel}
    >
      {state === "loading" ? (
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <CircularProgress size={loadingSpinnerSize} />
          <BodyText>{loadingLabel}</BodyText>
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          <PageTitleText variant="h6">{emptyTitle}</PageTitleText>
          <BodyText>{emptySubtitle}</BodyText>
        </Stack>
      )}
    </Paper>
  );
}
