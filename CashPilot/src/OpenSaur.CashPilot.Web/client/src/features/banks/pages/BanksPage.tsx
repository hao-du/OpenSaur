import { Alert, Stack } from "@mui/material";
import { useState } from "react";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { ConfirmModal } from "../../../components/atoms/ConfirmModal";
import { useSettings } from "../../settings/provider/SettingProvider";
import { BankFormDrawer } from "../components/BankFormDrawer";
import { BanksFilterDrawer } from "../components/BanksFilterDrawer";
import { BanksList } from "../components/BanksList";
import { useBanksLogic } from "../hooks/useBanksLogic";

export function BanksPage() {
  const { t } = useSettings();
  const [filters, setFilters] = useState({
    isActive: true,
    name: "",
    shortName: "",
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const {
    banks,
    closeDeleteConfirm,
    closeForm,
    deletingBank,
    errorMessage,
    isEditMode,
    isFormOpen,
    isSubmitting,
    handleCreate,
    handleDeleteConfirmed,
    handleEdit,
    handleSubmit,
    isLoading,
    form,
    openDeleteConfirm,
  } = useBanksLogic(filters);

  const headerActions = (
    <Stack direction="row" spacing={1.25}>
      <ActionButton
        onClick={() => {
          setIsFilterDrawerOpen(true);
        }}
        variant="outlined"
      >
        {t("common.filter")}
      </ActionButton>
      <ActionButton onClick={handleCreate}>{t("common.create")}</ActionButton>
    </Stack>
  );

  return (
    <DefaultLayout headerActions={headerActions} title={t("banks.title")}>
      <Stack spacing={3}>
        {errorMessage != null ? (
          <Alert severity="error">{errorMessage}</Alert>
        ) : null}
        <BanksList
          banks={banks}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          onDelete={(bank) => {
            openDeleteConfirm(bank);
          }}
          onEdit={(bank) => {
            handleEdit(bank);
          }}
        />
      </Stack>
      <BankFormDrawer
        form={form}
        isEditMode={isEditMode}
        isOpen={isFormOpen}
        isSubmitting={isSubmitting}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />
      <ConfirmModal
        confirmLabel={t("banks.delete")}
        isConfirming={isSubmitting}
        message={
          deletingBank == null
            ? ""
            : t("banks.deleteConfirm").replace("{name}", deletingBank.name)
        }
        onClose={() => {
          closeDeleteConfirm();
        }}
        onConfirm={() => {
          void handleDeleteConfirmed();
        }}
        open={deletingBank !== null}
        title={t("banks.deleteTitle")}
      />
      <BanksFilterDrawer
        initialValues={filters}
        isOpen={isFilterDrawerOpen}
        onApply={(values) => {
          setFilters(values);
          setIsFilterDrawerOpen(false);
        }}
        onClose={() => {
          setIsFilterDrawerOpen(false);
        }}
      />
    </DefaultLayout>
  );
}

