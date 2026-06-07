import { Alert, Stack } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { ConfirmModal } from "../../../components/atoms/ConfirmModal";
import { useCrudPageState } from "../../../components/hooks/useCrudPageState";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { useSettings } from "../../settings/provider/SettingProvider";
import { CurrenciesFilterDrawer } from "../components/CurrenciesFilterDrawer";
import { CurrenciesList } from "../components/CurrenciesList";
import { CurrencyFormDrawer } from "../components/CurrencyFormDrawer";
import type { CurrencyFormValues } from "../components/CurrencyForm";
import type {
  CurrencyDto,
  UpsertCurrencyRequestDto,
} from "../dtos/CurrencyDto";
import { useCreateCurrencyMutation } from "../hooks/useCreateCurrencyMutation";
import { useDeleteCurrencyMutation } from "../hooks/useDeleteCurrencyMutation";
import { useCurrenciesQuery } from "../hooks/useCurrenciesQuery";
import { useUpdateCurrencyMutation } from "../hooks/useUpdateCurrencyMutation";

const emptyFormState: CurrencyFormValues = {
  description: "",
  isDefault: false,
  name: "",
  shortName: "",
};

export function CurrenciesPage() {
  const { t } = useSettings();
  const [filters, setFilters] = useState({
    isActive: true,
    name: "",
    shortName: "",
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const { data: currencies = [], isLoading } = useCurrenciesQuery(filters);
  const createCurrencyMutation = useCreateCurrencyMutation();
  const updateCurrencyMutation = useUpdateCurrencyMutation();
  const deleteCurrencyMutation = useDeleteCurrencyMutation();
  const {
    closeDeleteConfirm,
    closeForm,
    deletingItem: deletingCurrency,
    editingItem: editingCurrency,
    errorMessage,
    isEditMode,
    isFormOpen,
    isSubmitting,
    openCreateForm: openCrudCreateForm,
    openDeleteConfirm,
    openEditForm: openCrudEditForm,
    setEditingItem,
    setErrorMessage,
    setIsFormOpen,
    setIsSubmitting,
  } = useCrudPageState<CurrencyDto>();
  const form = useForm<CurrencyFormValues>({
    defaultValues: emptyFormState,
  });

  async function handleSubmit(values: CurrencyFormValues) {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload: UpsertCurrencyRequestDto = {
        description:
          values.description.trim().length === 0
            ? null
            : values.description.trim(),
        isDefault: values.isDefault,
        name: values.name.trim(),
        shortName: values.shortName.trim().toUpperCase(),
      };

      if (editingCurrency == null) {
        await createCurrencyMutation.mutateAsync(payload);
      } else {
        await updateCurrencyMutation.mutateAsync({
          id: editingCurrency.id,
          payload,
        });
      }

      form.reset(emptyFormState);
      setEditingItem(null);
      setIsFormOpen(false);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("currencies.errorSave")));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (deletingCurrency == null) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await deleteCurrencyMutation.mutateAsync(deletingCurrency.id);
      if (editingCurrency?.id === deletingCurrency.id) {
        closeForm();
        form.reset(emptyFormState);
      }
      closeDeleteConfirm();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("currencies.errorDelete")));
    } finally {
      setIsSubmitting(false);
    }
  }

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
        onClick={() => {
          form.reset(emptyFormState);
          openCrudCreateForm();
        }}
      >
        {t("common.create")}
      </ActionButton>
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
            form.reset({
              description: currency.description ?? "",
              isDefault: currency.isDefault,
              name: currency.name,
              shortName: currency.shortName,
            });
            openCrudEditForm(currency);
          }}
        />
      </Stack>
      <CurrencyFormDrawer
        form={form}
        isEditMode={isEditMode}
        isOpen={isFormOpen}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (isSubmitting) {
            return;
          }

          closeForm();
          form.reset(emptyFormState);
        }}
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
          if (isSubmitting) {
            return;
          }

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

