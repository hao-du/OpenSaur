import { Alert, Stack } from "@mui/material";
import { AxiosError } from "axios";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { ConfirmModal } from "../../../components/atoms/ConfirmModal";
import { useSettings } from "../../settings/provider/SettingProvider";
import { BankFormDrawer } from "../components/BankFormDrawer";
import type { BankFormValues } from "../components/BankForm";
import { BanksFilterDrawer } from "../components/BanksFilterDrawer";
import { BanksList } from "../components/BanksList";
import type { BankDto, UpsertBankRequestDto } from "../dtos/BankDto";
import { createBank, deleteBank, updateBank } from "../api/banksApi";
import { useBanksQuery } from "../hooks/useBanksQuery";

const emptyFormState: BankFormValues = {
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

export function BanksPage() {
  const { t } = useSettings();
  const [filters, setFilters] = useState({
    isActive: true,
    name: "",
    shortName: ""
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const { data: banks = [], isLoading, refetch } = useBanksQuery(filters);
  const [editingBank, setEditingBank] = useState<BankDto | null>(null);
  const [deletingBank, setDeletingBank] = useState<BankDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm<BankFormValues>({
    defaultValues: emptyFormState
  });
  const isEditMode = useMemo(() => editingBank != null, [editingBank]);

  async function handleSubmit(values: BankFormValues) {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload: UpsertBankRequestDto = {
        description: values.description.trim().length === 0 ? null : values.description.trim(),
        isDefault: values.isDefault,
        name: values.name.trim(),
        shortName: values.shortName.trim().toUpperCase()
      };

      if (editingBank == null) {
        await createBank(payload);
      } else {
        await updateBank(editingBank.id, payload);
      }

      form.reset(emptyFormState);
      setEditingBank(null);
      setIsFormOpen(false);
      await refetch();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t("banks.errorSave")));
    } finally {
      setIsSubmitting(false);
    }
  }

  function openCreateForm() {
    setEditingBank(null);
    form.reset(emptyFormState);
    setIsFormOpen(true);
  }

  function openEditForm(bank: BankDto) {
    setEditingBank(bank);
    form.reset({
      description: bank.description ?? "",
      isDefault: bank.isDefault,
      name: bank.name,
      shortName: bank.shortName
    });
    setIsFormOpen(true);
  }

  async function handleDeleteConfirmed() {
    if (deletingBank == null) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await deleteBank(deletingBank.id);
      if (editingBank?.id === deletingBank.id) {
        setEditingBank(null);
        form.reset(emptyFormState);
        setIsFormOpen(false);
      }
      await refetch();
      setDeletingBank(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t("banks.errorDelete")));
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
        {t("banks.filter")}
      </ActionButton>
      <ActionButton onClick={openCreateForm}>
        {t("banks.create")}
      </ActionButton>
    </Stack>
  );

  return (
    <DefaultLayout
      headerActions={headerActions}
      title={t("banks.title")}
    >
      <Stack spacing={3}>
        {errorMessage != null ? <Alert severity="error">{errorMessage}</Alert> : null}
        <BanksList
          banks={banks}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          onDelete={bank => {
            setDeletingBank(bank);
          }}
          onEdit={openEditForm}
        />
      </Stack>
      <BankFormDrawer
        form={form}
        isEditMode={isEditMode}
        isOpen={isFormOpen}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (isSubmitting) {
            return;
          }

          setIsFormOpen(false);
          setEditingBank(null);
          form.reset(emptyFormState);
        }}
        onSubmit={handleSubmit}
      />
      <ConfirmModal
        confirmLabel={t("banks.delete")}
        isConfirming={isSubmitting}
        message={deletingBank == null
          ? ""
          : t("banks.deleteConfirm").replace("{name}", deletingBank.name)}
        onClose={() => {
          if (isSubmitting) {
            return;
          }

          setDeletingBank(null);
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
