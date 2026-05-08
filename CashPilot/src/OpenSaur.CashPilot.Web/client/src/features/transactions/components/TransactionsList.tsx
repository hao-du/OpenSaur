import { Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { BodyText } from "../../../components/atoms/BodyText";
import { LinkButton } from "../../../components/atoms/LinkButton";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { TransactionDto } from "../dtos/TransactionDto";

type TransactionsListProps = {
  isLoading: boolean;
  isSubmitting: boolean;
  onDelete: (transaction: TransactionDto) => void;
  onEdit: (transaction: TransactionDto) => void;
  transactions: TransactionDto[];
};

export function TransactionsList({
  isLoading,
  isSubmitting,
  onDelete,
  onEdit,
  transactions
}: TransactionsListProps) {
  const { formatDateTime, t } = useSettings();

  if (isLoading) {
    return (
      <Paper elevation={0} sx={layoutStyles.loadingPanel}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <BodyText>{t("transactions.loading")}</BodyText>
        </Stack>
      </Paper>
    );
  }

  if (transactions.length === 0) {
    return (
      <Paper elevation={0} sx={layoutStyles.emptyStatePanel}>
        <Stack spacing={1.5}>
          <PageTitleText variant="h6">{t("transactions.emptyTitle")}</PageTitleText>
          <BodyText>{t("transactions.emptySubtitle")}</BodyText>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={layoutStyles.borderedPanelScrollable}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t("transactions.transactedOn")}</TableCell>
            <TableCell>{t("transactions.type")}</TableCell>
            <TableCell>{t("transactions.direction")}</TableCell>
            <TableCell>{t("transactions.amount")}</TableCell>
            <TableCell>{t("transactions.currency")}</TableCell>
            <TableCell>{t("transactions.description")}</TableCell>
            <TableCell align="right">{t("transactions.actions")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map(transaction => (
            <TableRow hover key={transaction.id}>
              <TableCell>{formatDateTime(transaction.transactedOn)}</TableCell>
              <TableCell>{transaction.type}</TableCell>
              <TableCell>
                <Chip
                  color={transaction.isIncome ? "success" : "warning"}
                  label={transaction.isIncome ? t("transactions.income") : t("transactions.expense")}
                  size="small"
                  variant={transaction.isIncome ? "filled" : "outlined"}
                />
              </TableCell>
              <TableCell>{transaction.amount}</TableCell>
              <TableCell>{transaction.currencyName}</TableCell>
              <TableCell>{transaction.description ?? t("common.none")}</TableCell>
              <TableCell align="right">
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                  <LinkButton
                    disabled={isSubmitting}
                    onClick={() => {
                      onEdit(transaction);
                    }}
                  >
                    {t("transactions.edit")}
                  </LinkButton>
                  <LinkButton
                    color="error"
                    disabled={isSubmitting}
                    onClick={() => {
                      onDelete(transaction);
                    }}
                  >
                    {t("transactions.delete")}
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
