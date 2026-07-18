import { Stack, TableCell, TableRow } from "@mui/material";
import { LinkButton } from "../../../components/atoms/LinkButton";
import { DataTable } from "../../../components/organisms/DataTable";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { TemplateListItemDto } from "../dtos/TemplateDto";
import { getTemplateTypeLabel } from "../../../infrastructure/constants/transactionEnums";
import { TemplateTypeChip } from "./TemplateTypeChip";

type Props = {
  templates: TemplateListItemDto[];
  isLoading: boolean;
  isSubmitting: boolean;
  onDelete: (template: TemplateListItemDto) => void;
  onEdit: (template: TemplateListItemDto) => void;
  onPopulate: (template: TemplateListItemDto) => void;
};

export function TemplatesList({ isLoading, isSubmitting, onDelete, onEdit, onPopulate, templates }: Props) {
  const { t } = useSettings();

  return (
    <DataTable
      columns={[
        { key: "name", label: t("common.name") },
        { key: "templateType", label: t("templates.templateType") },
        { key: "description", label: t("common.description") },
        { key: "actions", label: t("common.actions"), align: "right" },
      ]}
      emptySubtitle={t("templates.emptySubtitle")}
      emptyTitle={t("templates.emptyTitle")}
      isLoading={isLoading}
      items={templates}
      loadingLabel={t("templates.loading")}
      renderRow={(item) => (
        <TableRow hover key={item.id}>
          <TableCell sx={layoutStyles.tableBodyCell}>{item.name}</TableCell>
          <TableCell sx={layoutStyles.tableBodyCell}>
            <TemplateTypeChip label={getTemplateTypeLabel(item.templateType, t)} templateType={item.templateType} />
          </TableCell>
          <TableCell sx={layoutStyles.tableBodyCell}>{item.description ?? t("common.none")}</TableCell>
          <TableCell align="right" sx={layoutStyles.tableBodyCell}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
              <LinkButton disabled={isSubmitting} onClick={() => onEdit(item)}>
                {t("common.edit")}
              </LinkButton>
              <LinkButton disabled={isSubmitting} onClick={() => onPopulate(item)}>
                {t("templates.populate")}
              </LinkButton>
              <LinkButton color="error" disabled={isSubmitting} onClick={() => onDelete(item)}>
                {t("common.delete")}
              </LinkButton>
            </Stack>
          </TableCell>
        </TableRow>
      )}
    />
  );
}
