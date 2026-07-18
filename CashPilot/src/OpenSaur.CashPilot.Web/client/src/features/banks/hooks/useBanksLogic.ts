import { useForm } from "react-hook-form";
import { useCrudPageState } from "../../../components/hooks/useCrudPageState";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { useSettings } from "../../settings/provider/SettingProvider";
import { useBanksQuery } from "./useBanksQuery";
import { useCreateBankMutation } from "./useCreateBankMutation";
import { useDeleteBankMutation } from "./useDeleteBankMutation";
import { useUpdateBankMutation } from "./useUpdateBankMutation";
import type { BankFilterParams } from "../api/banksApi";
import type { BankDto, UpsertBankRequestDto } from "../dtos/BankDto";
import type { BankFormValues } from "../components/BankForm";

const emptyFormState: BankFormValues = {
  description: "",
  isDefault: false,
  name: "",
  shortName: "",
};

function toNullableText(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function buildPayload(values: BankFormValues): UpsertBankRequestDto {
  return {
    description: toNullableText(values.description),
    isDefault: values.isDefault,
    name: values.name.trim(),
    shortName: values.shortName.trim().toUpperCase(),
  };
}

export function useBanksLogic(filters: BankFilterParams) {
  const { t } = useSettings();
  const { data: banks = [], isLoading } = useBanksQuery(filters);
  const createBankMutation = useCreateBankMutation();
  const updateBankMutation = useUpdateBankMutation();
  const deleteBankMutation = useDeleteBankMutation();
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
  } = useCrudPageState<BankDto>();
  const form = useForm<BankFormValues>({
    defaultValues: emptyFormState,
  });

  async function handleSubmit(values: BankFormValues) {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = buildPayload(values);

      if (editingItem == null) {
        await createBankMutation.mutateAsync(payload);
      } else {
        await updateBankMutation.mutateAsync({
          id: editingItem.id,
          payload,
        });
      }

      form.reset(emptyFormState);
      setEditingItem(null);
      setIsFormOpen(false);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("banks.errorSave")));
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
      await deleteBankMutation.mutateAsync(deletingItem.id);
      if (editingItem?.id === deletingItem.id) {
        closeForm();
        form.reset(emptyFormState);
      }
      closeDeleteConfirm();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("banks.errorDelete")));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCreate() {
    form.reset(emptyFormState);
    setErrorMessage(null);
    openCreateForm();
  }

  function handleEdit(bank: BankDto) {
    setErrorMessage(null);
    form.reset({
      description: bank.description ?? "",
      isDefault: bank.isDefault,
      name: bank.name,
      shortName: bank.shortName,
    });
    openEditForm(bank);
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
    banks,
    closeDeleteConfirm: handleCloseDeleteConfirm,
    closeForm: handleCloseForm,
    deletingBank: deletingItem,
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
