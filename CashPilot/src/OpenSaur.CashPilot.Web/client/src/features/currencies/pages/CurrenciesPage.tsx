import { Alert, Stack } from "@mui/material";
import { AxiosError } from "axios";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { ConfirmationDialog } from "../../../components/organisms/ConfirmationDialog";
import { useSettings } from "../../settings/provider/SettingProvider";
import { createCurrency, deleteCurrency, updateCurrency } from "../api/currenciesApi";
import { CurrenciesFilterDrawer } from "../components/CurrenciesFilterDrawer";
import { CurrenciesList } from "../components/CurrenciesList";
import { CurrencyFormDrawer } from "../components/CurrencyFormDrawer";
import type { CurrencyFormValues } from "../components/CurrencyForm";
import type { CurrencyDto, UpsertCurrencyRequestDto } from "../dtos/CurrencyDto";
import { useCurrenciesQuery } from "../hooks/useCurrenciesQuery";

const emptyFormState: CurrencyFormValues = {
  description: "",
  isDefault: false,
  name: "",
  shortName: ""
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const detail = error.response?.data;
    if (typeof detail === "string" && detail.trim().length > 0) {
      return detail;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

export function CurrenciesPage() {
  const { t } = useSettings();
  const [filters, setFilters] = useState({
    isActive: true,
    name: "",
    shortName: ""
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const { data: currencies = [], isLoading, refetch } = useCurrenciesQuery(filters);
  const [editingCurrency, setEditingCurrency] = useState<CurrencyDto | null>(null);
  const [deletingCurrency, setDeletingCurrency] = useState<CurrencyDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm<CurrencyFormValues>({
    defaultValues: emptyFormState
  });
  const isEditMode = useMemo(() => editingCurrency != null, [editingCurrency]);

  async function handleSubmit(values: CurrencyFormValues) {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload: UpsertCurrencyRequestDto = {
        description: values.description.trim().length === 0 ? null : values.description.trim(),
        isDefault: values.isDefault,
        name: values.name.trim(),
        shortName: values.shortName.trim().toUpperCase()
      };

      if (editingCurrency == null) {
        await createCurrency(payload);
      } else {
        await updateCurrency(editingCurrency.id, payload);
      }

      form.reset(emptyFormState);
      setEditingCurrency(null);
      setIsFormOpen(false);
      await refetch();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t("currencies.errorSave")));
    } finally {
      setIsSubmitting(false);
    }
  }

  function openCreateForm() {
    setEditingCurrency(null);
    form.reset(emptyFormState);
    setIsFormOpen(true);
  }

  function openEditForm(currency: CurrencyDto) {
    setEditingCurrency(currency);
    form.reset({
      description: currency.description ?? "",
      isDefault: currency.isDefault,
      name: currency.name,
      shortName: currency.shortName
    });
    setIsFormOpen(true);
  }

  async function handleDeleteConfirmed() {
    if (deletingCurrency == null) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await deleteCurrency(deletingCurrency.id);
      if (editingCurrency?.id === deletingCurrency.id) {
        setEditingCurrency(null);
        form.reset(emptyFormState);
        setIsFormOpen(false);
      }
      await refetch();
      setDeletingCurrency(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t("currencies.errorDelete")));
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
        {t("currencies.filter")}
      </ActionButton>
      <ActionButton onClick={openCreateForm}>
        {t("currencies.create")}
      </ActionButton>
    </Stack>
  );

  return (
    <DefaultLayout headerActions={headerActions} title={t("currencies.title")}>
      <Stack spacing={3}>
        {errorMessage != null ? <Alert severity="error">{errorMessage}</Alert> : null}
        <CurrenciesList
          currencies={currencies}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          onDelete={currency => {
            setDeletingCurrency(currency);
          }}
          onEdit={openEditForm}
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

          setIsFormOpen(false);
          setEditingCurrency(null);
          form.reset(emptyFormState);
        }}
        onSubmit={handleSubmit}
      />
      <ConfirmationDialog
        confirmLabel={t("currencies.delete")}
        isConfirming={isSubmitting}
        message={deletingCurrency == null
          ? ""
          : t("currencies.deleteConfirm").replace("{name}", deletingCurrency.name)}
        onClose={() => {
          if (isSubmitting) {
            return;
          }

          setDeletingCurrency(null);
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
        onApply={values => {
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
