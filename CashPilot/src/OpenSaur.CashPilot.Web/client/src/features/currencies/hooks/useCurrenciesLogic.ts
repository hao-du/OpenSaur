import { useForm } from "react-hook-form";
import { useCrudPageState } from "../../../components/hooks/useCrudPageState";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { useSettings } from "../../settings/provider/SettingProvider";
import { useCurrenciesQuery } from "./useCurrenciesQuery";
import { useCreateCurrencyMutation } from "./useCreateCurrencyMutation";
import { useDeleteCurrencyMutation } from "./useDeleteCurrencyMutation";
import { useUpdateCurrencyMutation } from "./useUpdateCurrencyMutation";
import type { CurrencyFilterParams } from "../api/currenciesApi";
import type { CurrencyDto, UpsertCurrencyRequestDto } from "../dtos/CurrencyDto";
import type { CurrencyFormValues } from "../components/CurrencyForm";

const emptyFormState: CurrencyFormValues = {
  description: "",
  isDefault: false,
  name: "",
  shortName: "",
};

function toNullableText(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function buildPayload(values: CurrencyFormValues): UpsertCurrencyRequestDto {
  return {
    description: toNullableText(values.description),
    isDefault: values.isDefault,
    name: values.name.trim(),
    shortName: values.shortName.trim().toUpperCase(),
  };
}

export function useCurrenciesLogic(filters: CurrencyFilterParams) {
  const { t } = useSettings();
  const { data: currencies = [], isLoading } = useCurrenciesQuery(filters);
  const createCurrencyMutation = useCreateCurrencyMutation();
  const updateCurrencyMutation = useUpdateCurrencyMutation();
  const deleteCurrencyMutation = useDeleteCurrencyMutation();
  const {
    closeDeleteConfirm,
    closeForm,
    deletingItem,
    editingItem,
    errorMessage,
    isEditMode,
    isFormOpen,
    isSubmitting,
    openCreateForm,
    openDeleteConfirm,
    openEditForm,
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
      const payload = buildPayload(values);

      if (editingItem == null) {
        await createCurrencyMutation.mutateAsync(payload);
      } else {
        await updateCurrencyMutation.mutateAsync({
          id: editingItem.id,
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
    if (deletingItem == null) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await deleteCurrencyMutation.mutateAsync(deletingItem.id);
      if (editingItem?.id === deletingItem.id) {
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

  function handleCreate() {
    form.reset(emptyFormState);
    setErrorMessage(null);
    openCreateForm();
  }

  function handleEdit(currency: CurrencyDto) {
    setErrorMessage(null);
    form.reset({
      description: currency.description ?? "",
      isDefault: currency.isDefault,
      name: currency.name,
      shortName: currency.shortName,
    });
    openEditForm(currency);
  }

  function handleCloseForm() {
    if (isSubmitting) {
      return;
    }

    closeForm();
    form.reset(emptyFormState);
  }

  function handleCloseDeleteConfirm() {
    if (isSubmitting) {
      return;
    }

    closeDeleteConfirm();
  }

  return {
    closeDeleteConfirm: handleCloseDeleteConfirm,
    closeForm: handleCloseForm,
    currencies,
    deletingCurrency: deletingItem,
    errorMessage,
    form,
    handleCreate,
    handleDeleteConfirmed,
    handleEdit,
    handleSubmit,
    isEditMode,
    isFormOpen,
    isLoading,
    isSubmitting,
    openDeleteConfirm,
  };
}
