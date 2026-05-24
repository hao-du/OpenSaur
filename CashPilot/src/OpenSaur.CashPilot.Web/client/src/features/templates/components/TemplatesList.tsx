import { Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { BodyText } from "../../../components/atoms/BodyText";
import { LinkButton } from "../../../components/atoms/LinkButton";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { TemplateListItemDto } from "../dtos/TemplateDto";

type Props = {
  templates: TemplateListItemDto[];
  isLoading: boolean;
  isSubmitting: boolean;
  onDelete: (template: TemplateListItemDto) => void;
  onEdit: (template: TemplateListItemDto) => void;
};

function typeLabel(templateType: number, t: (key: any) => string) {
  if (templateType === 1) return t("templates.templateType.cashFlow");
  if (templateType === 2) return t("templates.templateType.transfer");
  if (templateType === 3) return t("templates.templateType.exchange");
  return t("templates.templateType.bankAccount");
}

export function TemplatesList({ isLoading, isSubmitting, onDelete, onEdit, templates }: Props) {
  const { t } = useSettings();

  if (isLoading) {
    return (
      <Paper elevation={0} sx={layoutStyles.loadingPanel}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <BodyText>{t("templates.loading")}</BodyText>
        </Stack>
      </Paper>
    );
  }

  if (templates.length === 0) {
    return (
      <Paper elevation={0} sx={layoutStyles.emptyStatePanel}>
        <Stack spacing={1.5}>
          <PageTitleText variant="h6">{t("templates.emptyTitle")}</PageTitleText>
          <BodyText>{t("templates.emptySubtitle")}</BodyText>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={layoutStyles.borderedPanelScrollable}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ py: 1 }}>{t("currencies.name")}</TableCell>
            <TableCell sx={{ py: 1 }}>{t("templates.templateType")}</TableCell>
            <TableCell sx={{ py: 1 }}>{t("currencies.description")}</TableCell>
            <TableCell sx={{ py: 1 }}>{t("counterparties.active")}</TableCell>
            <TableCell align="right" sx={{ py: 1 }}>{t("counterparties.actions")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {templates.map(item => (
            <TableRow hover key={item.id}>
              <TableCell sx={{ py: 0.8 }}>{item.name}</TableCell>
              <TableCell sx={{ py: 0.8 }}>{typeLabel(item.templateType, t)}</TableCell>
              <TableCell sx={{ py: 0.8 }}>{item.description ?? t("common.none")}</TableCell>
              <TableCell sx={{ py: 0.8 }}>
                {item.isActive ? <Chip label={t("common.yes")} size="small" sx={{ bgcolor: "primary.main", color: "white" }} /> : <Chip label={t("common.no")} size="small" variant="outlined" />}
              </TableCell>
              <TableCell align="right" sx={{ py: 0.8 }}>
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                  <LinkButton disabled={isSubmitting} onClick={() => onEdit(item)}>{t("counterparties.edit")}</LinkButton>
                  <LinkButton color="error" disabled={isSubmitting} onClick={() => onDelete(item)}>{t("counterparties.delete")}</LinkButton>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

