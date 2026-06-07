import { Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { BodyText } from "../../../components/atoms/BodyText";
import { LinkButton } from "../../../components/atoms/LinkButton";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { TagDto } from "../dtos/TagDto";

const MAX_MATCHING_TERMS_TO_SHOW = 3;

type TagsListProps = {
  isLoading: boolean;
  isSubmitting: boolean;
  onDelete: (tag: TagDto) => void;
  onEdit: (tag: TagDto) => void;
  tags: TagDto[];
};

export function TagsList({ isLoading, isSubmitting, onDelete, onEdit, tags }: TagsListProps) {
  const { t } = useSettings();
  const noneLabel = t("common.none").replace(/^\(|\)$/g, "");

  if (isLoading) {
    return (
      <Paper elevation={0} sx={layoutStyles.loadingPanel}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <BodyText>{t("tags.loading")}</BodyText>
        </Stack>
      </Paper>
    );
  }

  if (tags.length === 0) {
    return (
      <Paper elevation={0} sx={layoutStyles.emptyStatePanel}>
        <Stack spacing={1.5}>
          <PageTitleText variant="h6">{t("tags.emptyTitle")}</PageTitleText>
          <BodyText>{t("tags.emptySubtitle")}</BodyText>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={layoutStyles.borderedPanelScrollable}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ py: 1 }}>{t("tags.name")}</TableCell>
            <TableCell sx={{ py: 1 }}>{t("tags.matchingTerms")}</TableCell>
            <TableCell align="right" sx={{ py: 1 }}>{t("common.actions")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tags.map(tag => (
            <TableRow hover key={tag.id}>
              <TableCell sx={{ py: 0.8 }}>{tag.name}</TableCell>
              <TableCell sx={{ py: 0.8 }}>
                {tag.matchingTerms.length === 0 ? (
                  <Chip color="error" label={noneLabel} size="small" variant="outlined" />
                ) : (
                  <Stack direction="row" flexWrap="wrap" spacing={0.75} useFlexGap>
                    <span>{tag.matchingTerms.slice(0, MAX_MATCHING_TERMS_TO_SHOW).join(", ")}</span>
                    {tag.matchingTerms.length > MAX_MATCHING_TERMS_TO_SHOW ? (
                      <Tooltip
                        arrow
                        title={tag.matchingTerms.slice(MAX_MATCHING_TERMS_TO_SHOW).join(", ")}
                      >
                        <Chip
                          label={`+${tag.matchingTerms.length - MAX_MATCHING_TERMS_TO_SHOW} ${t("common.more")}`}
                          size="small"
                          variant="outlined"
                          sx={{
                            color: (theme) => theme.palette.secondary.main,
                            backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.08),
                            border: (theme) => `1px solid ${alpha(theme.palette.secondary.main, 0.28)}`,
                          }}
                        />
                      </Tooltip>
                    ) : null}
                  </Stack>
                )}
              </TableCell>
              <TableCell align="right" sx={{ py: 0.8 }}>
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                  <LinkButton disabled={isSubmitting} onClick={() => onEdit(tag)}>{t("common.edit")}</LinkButton>
                  <LinkButton color="error" disabled={isSubmitting} onClick={() => onDelete(tag)}>{t("common.delete")}</LinkButton>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
          </TableBody>
      </Table>
    </Paper>
  );
}
