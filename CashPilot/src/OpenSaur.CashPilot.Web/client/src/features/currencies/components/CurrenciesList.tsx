import { TableCell, TableRow } from "@mui/material";
import { BooleanChip } from "../../../components/atoms/BooleanChip";
import { LinkButton } from "../../../components/atoms/LinkButton";
import { DataTable } from "../../../components/organisms/DataTable";
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
  onEdit,
}: CurrenciesListProps) {
  const { t } = useSettings();

  return (
    <DataTable
      columns={[
        { key: "name", label: t("common.name") },
        { key: "shortName", label: t("currencies.shortCode") },
        { key: "description", label: t("common.description") },
        { key: "isDefault", label: t("common.isDefault") },
        { key: "actions", label: t("common.actions"), align: "right" },
      ]}
      emptySubtitle={t("currencies.emptySubtitle")}
      emptyTitle={t("currencies.emptyTitle")}
      isLoading={isLoading}
      items={currencies}
      loadingLabel={t("currencies.loading")}
      renderRow={(currency) => (
        <TableRow hover key={currency.id}>
          <TableCell>{currency.name}</TableCell>
          <TableCell>{currency.shortName}</TableCell>
          <TableCell>{currency.description ?? t("common.none")}</TableCell>
          <TableCell>
            <BooleanChip
              falseLabel={t("common.no")}
              trueLabel={t("common.yes")}
              value={currency.isDefault}
            />
          </TableCell>
          <TableCell align="right">
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
          </TableCell>
        </TableRow>
      )}
    />
  );
}
