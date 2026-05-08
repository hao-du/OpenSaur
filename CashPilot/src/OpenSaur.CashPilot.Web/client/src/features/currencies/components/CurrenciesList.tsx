import { Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { BodyText } from "../../../components/atoms/BodyText";
import { LinkButton } from "../../../components/atoms/LinkButton";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { CurrencyDto } from "../dtos/CurrencyDto";

type CurrenciesListProps = {
  currencies: CurrencyDto[];
  isLoading: boolean;
  isSubmitting: boolean;
  onDelete: (currency: CurrencyDto) => void;
  onEdit: (currency: CurrencyDto) => void;
};

export function CurrenciesList({
  currencies,
  isLoading,
  isSubmitting,
  onDelete,
  onEdit
}: CurrenciesListProps) {
  const { t } = useSettings();

  if (isLoading) {
    return (
      <Paper elevation={0} sx={layoutStyles.loadingPanel}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <BodyText>{t("currencies.loading")}</BodyText>
        </Stack>
      </Paper>
    );
  }

  if (currencies.length === 0) {
    return (
      <Paper elevation={0} sx={layoutStyles.emptyStatePanel}>
        <Stack spacing={1.5}>
          <PageTitleText variant="h6">{t("currencies.emptyTitle")}</PageTitleText>
          <BodyText>{t("currencies.emptySubtitle")}</BodyText>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={layoutStyles.borderedPanelScrollable}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t("currencies.name")}</TableCell>
            <TableCell>{t("currencies.shortCode")}</TableCell>
            <TableCell>{t("currencies.description")}</TableCell>
            <TableCell>{t("currencies.isDefault")}</TableCell>
            <TableCell align="right">{t("currencies.actions")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {currencies.map(currency => (
            <TableRow hover key={currency.id}>
              <TableCell>{currency.name}</TableCell>
              <TableCell>{currency.shortName}</TableCell>
              <TableCell>{currency.description ?? t("common.none")}</TableCell>
              <TableCell>
                {currency.isDefault ? (
                  <Chip
                    label="Yes"
                    size="small"
                    sx={{
                      bgcolor: "primary.main",
                      color: "white"
                    }}
                  />
                ) : (
                  <Chip
                    label="No"
                    size="small"
                    variant="outlined"
                  />
                )}
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                  <LinkButton
                    disabled={isSubmitting}
                    onClick={() => {
                      onEdit(currency);
                    }}
                  >
                    {t("currencies.edit")}
                  </LinkButton>
                  <LinkButton
                    color="error"
                    disabled={isSubmitting}
                    onClick={() => {
                      onDelete(currency);
                    }}
                  >
                    {t("currencies.delete")}
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
