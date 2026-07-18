import { Alert, Stack } from "@mui/material";
import { useState } from "react";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { ConfirmModal } from "../../../components/atoms/ConfirmModal";
import { useSettings } from "../../settings/provider/SettingProvider";
import { CurrenciesFilterDrawer } from "../components/CurrenciesFilterDrawer";
import { CurrenciesList } from "../components/CurrenciesList";
import { CurrencyFormDrawer } from "../components/CurrencyFormDrawer";
import { useCurrenciesLogic } from "../hooks/useCurrenciesLogic";

export function CurrenciesPage() {
  const { t } = useSettings();
  const [filters, setFilters] = useState({
    isActive: true,
    name: "",
    shortName: "",
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const {
    closeDeleteConfirm,
    closeForm,
    currencies,
    deletingCurrency,
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
  } = useCurrenciesLogic(filters);

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
    <DefaultLayout headerActions={headerActions} title={t("currencies.title")}>
      <Stack spacing={3}>
        {errorMessage != null ? (
          <Alert severity="error">{errorMessage}</Alert>
        ) : null}
        <CurrenciesList
          currencies={currencies}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          onDelete={(currency) => {
            openDeleteConfirm(currency);
          }}
          onEdit={(currency) => {
            handleEdit(currency);
          }}
        />
      </Stack>
      <CurrencyFormDrawer
        form={form}
        isEditMode={isEditMode}
        isOpen={isFormOpen}
        isSubmitting={isSubmitting}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />
      <ConfirmModal
        confirmLabel={t("currencies.delete")}
        isConfirming={isSubmitting}
        message={
          deletingCurrency == null
            ? ""
            : t("currencies.deleteConfirm").replace(
                "{name}",
                deletingCurrency.name,
              )
        }
        onClose={() => {
          closeDeleteConfirm();
        }}
        onConfirm={() => {
          void handleDeleteConfirmed();
        }}
        open={deletingCurrency !== null}
        title={t("currencies.deleteTitle")}
      />
      <CurrenciesFilterDrawer
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

