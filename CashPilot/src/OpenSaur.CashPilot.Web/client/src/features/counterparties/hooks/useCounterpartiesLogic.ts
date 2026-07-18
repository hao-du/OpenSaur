import { useForm } from "react-hook-form";
import { useCrudPageState } from "../../../components/hooks/useCrudPageState";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { useSettings } from "../../settings/provider/SettingProvider";
import { useCounterpartiesQuery } from "./useCounterpartiesQuery";
import { useCreateCounterpartyMutation } from "./useCreateCounterpartyMutation";
import { useUpdateCounterpartyMutation } from "./useUpdateCounterpartyMutation";
import { useDeleteCounterpartyMutation } from "./useDeleteCounterpartyMutation";
import type { CounterpartyFilterParams } from "../api/counterpartiesApi";
import type { CounterpartyFormValues } from "../components/CounterpartyForm";
import type { CounterpartyDto, CreateCounterpartyRequestDto, UpdateCounterpartyRequestDto } from "../dtos/CounterpartyDto";

const emptyFormState: CounterpartyFormValues = {
  description: "",
  email: "",
  fullName: "",
  isActive: true,
  isDefault: false,
  phoneNumber: "",
};

function toNullableText(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function buildCreatePayload(
  values: CounterpartyFormValues,
): CreateCounterpartyRequestDto {
  return {
    description: toNullableText(values.description),
    email: toNullableText(values.email),
    fullName: values.fullName.trim(),
    isDefault: values.isDefault,
    phoneNumber: toNullableText(values.phoneNumber),
  };
}

function buildUpdatePayload(
  values: CounterpartyFormValues,
): UpdateCounterpartyRequestDto {
  return {
    description: toNullableText(values.description),
    email: toNullableText(values.email),
    fullName: values.fullName.trim(),
    isActive: values.isActive,
    isDefault: values.isDefault,
    phoneNumber: toNullableText(values.phoneNumber),
  };
}

export function useCounterpartiesLogic(filters: CounterpartyFilterParams) {
  const { t } = useSettings();
  const { data: counterparties = [], isLoading } = useCounterpartiesQuery(filters);
  const createCounterpartyMutation = useCreateCounterpartyMutation();
  const updateCounterpartyMutation = useUpdateCounterpartyMutation();
  const deleteCounterpartyMutation = useDeleteCounterpartyMutation();
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
  } = useCrudPageState<CounterpartyDto>();
  const form = useForm<CounterpartyFormValues>({
    defaultValues: emptyFormState,
  });

  async function handleSubmit(values: CounterpartyFormValues) {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (editingItem == null) {
        await createCounterpartyMutation.mutateAsync(buildCreatePayload(values));
      } else {
        await updateCounterpartyMutation.mutateAsync({
          id: editingItem.id,
          payload: buildUpdatePayload(values),
        });
      }

      form.reset(emptyFormState);
      setEditingItem(null);
      setIsFormOpen(false);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("counterparties.errorSave")));
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
      await deleteCounterpartyMutation.mutateAsync(deletingItem.id);
      if (editingItem?.id === deletingItem.id) {
        closeForm();
        form.reset(emptyFormState);
      }
      closeDeleteConfirm();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("counterparties.errorDelete")));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCreate() {
    form.reset(emptyFormState);
    setErrorMessage(null);
    openCreateForm();
  }

  function handleEdit(counterparty: CounterpartyDto) {
    setErrorMessage(null);
    form.reset({
      description: counterparty.description ?? "",
      email: counterparty.email ?? "",
      fullName: counterparty.fullName,
      isActive: counterparty.isActive,
      isDefault: counterparty.isDefault,
      phoneNumber: counterparty.phoneNumber ?? "",
    });
    openEditForm(counterparty);
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
    counterparties,
    deletingCounterparty: deletingItem,
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
