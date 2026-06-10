import { Alert, Stack } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { ConfirmModal } from "../../../components/atoms/ConfirmModal";
import { useCrudPageState } from "../../../components/hooks/useCrudPageState";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { useSettings } from "../../settings/provider/SettingProvider";
import { BankFormDrawer } from "../components/BankFormDrawer";
import type { BankFormValues } from "../components/BankForm";
import { BanksFilterDrawer } from "../components/BanksFilterDrawer";
import { BanksList } from "../components/BanksList";
import type { BankDto, UpsertBankRequestDto } from "../dtos/BankDto";
import { useCreateBankMutation } from "../hooks/useCreateBankMutation";
import { useDeleteBankMutation } from "../hooks/useDeleteBankMutation";
import { useBanksQuery } from "../hooks/useBanksQuery";
import { useUpdateBankMutation } from "../hooks/useUpdateBankMutation";

const emptyFormState: BankFormValues = {
  description: "",
  isDefault: false,
  name: "",
  shortName: "",
};

export function BanksPage() {
  const { t } = useSettings();
  const [filters, setFilters] = useState({
    isActive: true,
    name: "",
    shortName: "",
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const { data: banks = [], isLoading } = useBanksQuery(filters);
  const createBankMutation = useCreateBankMutation();
  const updateBankMutation = useUpdateBankMutation();
  const deleteBankMutation = useDeleteBankMutation();
  const {
    closeDeleteConfirm,
    closeForm,
    deletingItem: deletingBank,
    editingItem: editingBank,
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
  } = useCrudPageState<BankDto>();
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
  const form = useForm<BankFormValues>({
    defaultValues: emptyFormState,
  });

  async function handleSubmit(values: BankFormValues) {
    setFormErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload: UpsertBankRequestDto = {
        description:
          values.description.trim().length === 0
            ? null
            : values.description.trim(),
        isDefault: values.isDefault,
        name: values.name.trim(),
        shortName: values.shortName.trim().toUpperCase(),
      };

      if (editingBank == null) {
        await createBankMutation.mutateAsync(payload);
      } else {
        await updateBankMutation.mutateAsync({ id: editingBank.id, payload });
      }

      form.reset(emptyFormState);
      setEditingItem(null);
      setIsFormOpen(false);
    } catch (error) {
      setFormErrorMessage(getApiErrorMessage(error, t("banks.errorSave")));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (deletingBank == null) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await deleteBankMutation.mutateAsync(deletingBank.id);
      if (editingBank?.id === deletingBank.id) {
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
          setFormErrorMessage(null);
          openCrudCreateForm();
        }}
      >
        {t("common.create")}
      </ActionButton>
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
            setFormErrorMessage(null);
            form.reset({
              description: bank.description ?? "",
              isDefault: bank.isDefault,
              name: bank.name,
              shortName: bank.shortName,
            });
            openCrudEditForm(bank);
          }}
        />
      </Stack>
      <BankFormDrawer
        form={form}
        isEditMode={isEditMode}
        isOpen={isFormOpen}
        isSubmitting={isSubmitting}
        errorMessage={formErrorMessage}
        onClose={() => {
          if (isSubmitting) {
            return;
          }

          closeForm();
          setFormErrorMessage(null);
          form.reset(emptyFormState);
        }}
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
          if (isSubmitting) {
            return;
          }

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

