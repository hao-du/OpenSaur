import { CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { BodyText } from "../../../components/atoms/BodyText";
import { LinkButton } from "../../../components/atoms/LinkButton";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import type { CounterpartyDto } from "../dtos/CounterpartyDto";
import { useSettings } from "../../settings/provider/SettingProvider";

type CounterpartiesListProps = {
  counterparties: CounterpartyDto[];
  isLoading: boolean;
  isSubmitting: boolean;
  onDelete: (counterparty: CounterpartyDto) => void;
  onEdit: (counterparty: CounterpartyDto) => void;
};

export function CounterpartiesList({
  counterparties,
  isLoading,
  isSubmitting,
  onDelete,
  onEdit
}: CounterpartiesListProps) {
  const { t } = useSettings();
  if (isLoading) {
    return (
      <Paper elevation={0} sx={layoutStyles.loadingPanel}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <BodyText>{t("counterparties.loading")}</BodyText>
        </Stack>
      </Paper>
    );
  }

  if (counterparties.length === 0) {
    return (
      <Paper elevation={0} sx={layoutStyles.emptyStatePanel}>
        <Stack spacing={1.5}>
          <PageTitleText variant="h6">{t("counterparties.emptyTitle")}</PageTitleText>
          <BodyText>{t("counterparties.emptySubtitle")}</BodyText>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={layoutStyles.borderedPanelScrollable}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t("counterparties.fullName")}</TableCell>
            <TableCell>{t("counterparties.email")}</TableCell>
            <TableCell>{t("counterparties.phoneNumber")}</TableCell>
            <TableCell>{t("counterparties.description")}</TableCell>
            <TableCell align="right">{t("counterparties.actions")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {counterparties.map(counterparty => (
            <TableRow hover key={counterparty.id}>
              <TableCell>{counterparty.fullName}</TableCell>
              <TableCell>{counterparty.email ?? t("common.none")}</TableCell>
              <TableCell>{counterparty.phoneNumber ?? t("common.none")}</TableCell>
              <TableCell>{counterparty.description ?? t("common.none")}</TableCell>
              <TableCell align="right">
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                  <LinkButton
                    disabled={isSubmitting}
                    onClick={() => {
                      onEdit(counterparty);
                    }}
                  >
                    {t("counterparties.edit")}
                  </LinkButton>
                  <LinkButton
                    color="error"
                    disabled={isSubmitting}
                    onClick={() => {
                      onDelete(counterparty);
                    }}
                  >
                    {t("counterparties.delete")}
                  </LinkButton>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
