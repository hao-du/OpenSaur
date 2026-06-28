import { Chip, Stack, TableCell, TableRow } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { LinkButton } from "../../../components/atoms/LinkButton";
import { DataTable } from "../../../components/organisms/DataTable";
import { TooltipChip } from "../../../components/atoms/TooltipChip";
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

  return (
    <DataTable
      columns={[
        { key: "name", label: t("tags.name") },
        { key: "matchingTerms", label: t("tags.matchingTerms") },
        { key: "actions", label: t("common.actions"), align: "right" },
      ]}
      emptySubtitle={t("tags.emptySubtitle")}
      emptyTitle={t("tags.emptyTitle")}
      isLoading={isLoading}
      items={tags}
      loadingLabel={t("tags.loading")}
      renderRow={(tag) => (
        <TableRow hover key={tag.id}>
          <TableCell>
            {tag.name}
            {tag.isDefaultMaker ? (
              <Chip color="primary" label={t("tags.isDefaultMaker")} size="small" sx={{ ml: 1 }} variant="filled" />
            ) : tag.marker ? (
              <Chip color="success" label={t("tags.marker")} size="small" sx={{ ml: 1 }} variant="filled" />
            ) : null}
          </TableCell>
          <TableCell>
            {tag.matchingTerms.length === 0 ? (
              <Chip color="error" label={noneLabel} size="small" variant="outlined" />
            ) : (
              <Stack direction="row" flexWrap="wrap" spacing={0.75} useFlexGap>
                <span>{tag.matchingTerms.slice(0, MAX_MATCHING_TERMS_TO_SHOW).join(", ")}</span>
                {tag.matchingTerms.length > MAX_MATCHING_TERMS_TO_SHOW ? (
                  <TooltipChip
                    label={`+${tag.matchingTerms.length - MAX_MATCHING_TERMS_TO_SHOW} ${t("common.more")}`}
                    size="small"
                    sx={{
                      color: (theme) => theme.palette.secondary.main,
                      backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.08),
                      border: (theme) => `1px solid ${alpha(theme.palette.secondary.main, 0.28)}`,
                    }}
                    tooltipItems={tag.matchingTerms.slice(MAX_MATCHING_TERMS_TO_SHOW)}
                    variant="outlined"
                  />
                ) : null}
              </Stack>
            )}
          </TableCell>
          <TableCell align="right">
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <LinkButton disabled={isSubmitting} onClick={() => onEdit(tag)}>
                {t("common.edit")}
              </LinkButton>
              <LinkButton color="error" disabled={isSubmitting} onClick={() => onDelete(tag)}>
                {t("common.delete")}
              </LinkButton>
            </Stack>
          </TableCell>
        </TableRow>
      )}
    />
  );
}
