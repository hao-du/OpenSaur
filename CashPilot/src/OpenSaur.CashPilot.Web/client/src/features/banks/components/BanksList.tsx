import { Stack, TableCell, TableRow } from "@mui/material";
import { BooleanChip } from "../../../components/atoms/BooleanChip";
import { LinkButton } from "../../../components/atoms/LinkButton";
import { DataTable } from "../../../components/organisms/DataTable";
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
  onEdit,
}: BanksListProps) {
  const { t } = useSettings();

  return (
    <DataTable
      columns={[
        { key: "name", label: t("common.name") },
        { key: "shortName", label: t("banks.shortName") },
        { key: "description", label: t("common.description") },
        { key: "isDefault", label: t("common.isDefault") },
        { key: "actions", label: t("common.actions"), align: "right" },
      ]}
      emptySubtitle={t("banks.emptySubtitle")}
      emptyTitle={t("banks.emptyTitle")}
      isLoading={isLoading}
      items={banks}
      loadingLabel={t("banks.loading")}
      renderRow={(bank) => (
        <TableRow hover key={bank.id}>
          <TableCell>{bank.name}</TableCell>
          <TableCell>{bank.shortName}</TableCell>
          <TableCell>{bank.description ?? t("common.none")}</TableCell>
          <TableCell>
            <BooleanChip
              falseLabel={t("common.no")}
              trueLabel={t("common.yes")}
              value={bank.isDefault}
            />
          </TableCell>
          <TableCell align="right">
            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
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
      )}
    />
  );
}
