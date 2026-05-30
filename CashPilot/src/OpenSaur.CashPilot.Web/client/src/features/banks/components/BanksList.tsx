import { Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { BodyText } from "../../../components/atoms/BodyText";
import { LinkButton } from "../../../components/atoms/LinkButton";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { BankDto } from "../dtos/BankDto";

type BanksListProps = {
  banks: BankDto[];
  isLoading: boolean;
  isSubmitting: boolean;
  onDelete: (bank: BankDto) => void;
  onEdit: (bank: BankDto) => void;
};

export function BanksList({
  banks,
  isLoading,
  isSubmitting,
  onDelete,
  onEdit
}: BanksListProps) {
  const { t } = useSettings();
  if (isLoading) {
    return (
      <Paper elevation={0} sx={layoutStyles.loadingPanel}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <BodyText>{t("banks.loading")}</BodyText>
        </Stack>
      </Paper>
    );
  }

  if (banks.length === 0) {
    return (
      <Paper elevation={0} sx={layoutStyles.emptyStatePanel}>
        <Stack spacing={1.5}>
          <PageTitleText variant="h6">{t("banks.emptyTitle")}</PageTitleText>
          <BodyText>{t("banks.emptySubtitle")}</BodyText>
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
            <TableCell sx={{ py: 1 }}>{t("banks.shortName")}</TableCell>
            <TableCell sx={{ py: 1 }}>{t("common.description")}</TableCell>
            <TableCell sx={{ py: 1 }}>{t("common.isDefault")}</TableCell>
            <TableCell align="right" sx={{ py: 1 }}>{t("common.actions")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {banks.map(bank => (
            <TableRow hover key={bank.id}>
              <TableCell sx={{ py: 0.8 }}>{bank.name}</TableCell>
              <TableCell sx={{ py: 0.8 }}>{bank.shortName}</TableCell>
              <TableCell sx={{ py: 0.8 }}>{bank.description ?? t("common.none")}</TableCell>
              <TableCell sx={{ py: 0.8 }}>
                {bank.isDefault ? (
                  <Chip
                    label={t("common.yes")}
                    size="small"
                    sx={{
                      bgcolor: "primary.main",
                      color: "white"
                    }}
                  />
                ) : (
                  <Chip
                    label={t("common.no")}
                    size="small"
                    variant="outlined"
                  />
                )}
              </TableCell>
              <TableCell align="right" sx={{ py: 0.8 }}>
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                  <LinkButton
                    disabled={isSubmitting}
                    onClick={() => {
                      onEdit(bank);
                    }}
                  >
                    {t("common.edit")}
                  </LinkButton>
                  <LinkButton
                    color="error"
                    disabled={isSubmitting}
                    onClick={() => {
                      onDelete(bank);
                    }}
                  >
                    {t("common.delete")}
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

