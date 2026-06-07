import { Stack, TableCell, TableRow } from "@mui/material";
import { BooleanChip } from "../../../components/atoms/BooleanChip";
import { LinkButton } from "../../../components/atoms/LinkButton";
import { DataTable } from "../../../components/organisms/DataTable";
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
  onEdit,
}: CounterpartiesListProps) {
  const { t } = useSettings();

  return (
    <DataTable
      columns={[
        { key: "fullName", label: t("counterparties.fullName") },
        { key: "isDefault", label: t("common.isDefault") },
        { key: "email", label: t("counterparties.email") },
        { key: "phoneNumber", label: t("counterparties.phoneNumber") },
        { key: "description", label: t("common.description") },
        { key: "actions", label: t("common.actions"), align: "right" },
      ]}
      emptySubtitle={t("counterparties.emptySubtitle")}
      emptyTitle={t("counterparties.emptyTitle")}
      isLoading={isLoading}
      items={counterparties}
      loadingLabel={t("counterparties.loading")}
      renderRow={(counterparty) => (
        <TableRow hover key={counterparty.id}>
          <TableCell>{counterparty.fullName}</TableCell>
          <TableCell>
            <BooleanChip
              falseLabel={t("common.no")}
              trueLabel={t("common.yes")}
              value={counterparty.isDefault}
            />
          </TableCell>
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
                {t("common.edit")}
              </LinkButton>
              <LinkButton
                color="error"
                disabled={isSubmitting}
                onClick={() => {
                  onDelete(counterparty);
                }}
              >
                {t("common.delete")}
              </LinkButton>
            </Stack>
          </TableCell>
        </TableRow>
      )}
    />
  );
}
