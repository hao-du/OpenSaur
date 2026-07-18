import { Alert, Stack } from "@mui/material";
import { useState } from "react";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { ConfirmModal } from "../../../components/atoms/ConfirmModal";
import { useSettings } from "../../settings/provider/SettingProvider";
import { CounterpartiesFilterDrawer } from "../components/CounterpartiesFilterDrawer";
import { CounterpartiesList } from "../components/CounterpartiesList";
import { CounterpartyFormDrawer } from "../components/CounterpartyFormDrawer";
import { useCounterpartiesLogic } from "../hooks/useCounterpartiesLogic";

export function CounterpartiesPage() {
  const { t } = useSettings();
  const [filters, setFilters] = useState({
    email: "",
    fullName: "",
    isActive: true,
    phoneNumber: "",
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const {
    closeDeleteConfirm,
    closeForm,
    counterparties,
    deletingCounterparty,
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
  } = useCounterpartiesLogic(filters);

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
      <ActionButton
        onClick={handleCreate}
      >
        {t("common.create")}
      </ActionButton>
    </Stack>
  );

  return (
    <DefaultLayout
      headerActions={headerActions}
      title={t("counterparties.title")}
    >
      <Stack spacing={3}>
        {errorMessage != null ? (
          <Alert severity="error">{errorMessage}</Alert>
        ) : null}
        <CounterpartiesList
          counterparties={counterparties}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          onDelete={(counterparty) => {
            openDeleteConfirm(counterparty);
          }}
          onEdit={(counterparty) => {
            handleEdit(counterparty);
          }}
        />
      </Stack>
      <CounterpartyFormDrawer
        form={form}
        isEditMode={isEditMode}
        isOpen={isFormOpen}
        isSubmitting={isSubmitting}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />
      <ConfirmModal
        confirmLabel={t("counterparties.delete")}
        isConfirming={isSubmitting}
        message={
          deletingCounterparty == null
            ? ""
            : t("counterparties.deleteConfirm").replace(
                "{name}",
                deletingCounterparty.fullName,
              )
        }
        onClose={() => {
          closeDeleteConfirm();
        }}
        onConfirm={() => {
          void handleDeleteConfirmed();
        }}
        open={deletingCounterparty !== null}
        title={t("counterparties.deleteTitle")}
      />
      <CounterpartiesFilterDrawer
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

