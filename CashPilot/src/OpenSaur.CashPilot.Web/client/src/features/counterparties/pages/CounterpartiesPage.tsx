import { Alert, Stack } from "@mui/material";
import { AxiosError } from "axios";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { ConfirmationDialog } from "../../../components/organisms/ConfirmationDialog";
import { useSettings } from "../../settings/provider/SettingProvider";
import { createCounterparty, deleteCounterparty, updateCounterparty } from "../api/counterpartiesApi";
import { CounterpartiesFilterDrawer } from "../components/CounterpartiesFilterDrawer";
import { CounterpartiesList } from "../components/CounterpartiesList";
import { CounterpartyFormDrawer } from "../components/CounterpartyFormDrawer";
import type { CounterpartyFormValues } from "../components/CounterpartyForm";
import type { CounterpartyDto, CreateCounterpartyRequestDto, UpdateCounterpartyRequestDto } from "../dtos/CounterpartyDto";
import { useCounterpartiesQuery } from "../hooks/useCounterpartiesQuery";

const emptyFormState: CounterpartyFormValues = {
  description: "",
  email: "",
  fullName: "",
  isActive: true,
  phoneNumber: ""
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

export function CounterpartiesPage() {
  const { t } = useSettings();
  const [filters, setFilters] = useState({
    email: "",
    fullName: "",
    isActive: true,
    phoneNumber: ""
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const { data: counterparties = [], isLoading, refetch } = useCounterpartiesQuery(filters);
  const [editingCounterparty, setEditingCounterparty] = useState<CounterpartyDto | null>(null);
  const [deletingCounterparty, setDeletingCounterparty] = useState<CounterpartyDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm<CounterpartyFormValues>({
    defaultValues: emptyFormState
  });
  const isEditMode = useMemo(() => editingCounterparty != null, [editingCounterparty]);

  async function handleSubmit(values: CounterpartyFormValues) {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (editingCounterparty == null) {
        const payload: CreateCounterpartyRequestDto = {
          description: values.description.trim().length === 0 ? null : values.description.trim(),
          email: values.email.trim().length === 0 ? null : values.email.trim(),
          fullName: values.fullName.trim(),
          phoneNumber: values.phoneNumber.trim().length === 0 ? null : values.phoneNumber.trim()
        };

        await createCounterparty(payload);
      } else {
        const payload: UpdateCounterpartyRequestDto = {
          description: values.description.trim().length === 0 ? null : values.description.trim(),
          email: values.email.trim().length === 0 ? null : values.email.trim(),
          fullName: values.fullName.trim(),
          isActive: values.isActive,
          phoneNumber: values.phoneNumber.trim().length === 0 ? null : values.phoneNumber.trim()
        };

        await updateCounterparty(editingCounterparty.id, payload);
      }

      form.reset(emptyFormState);
      setEditingCounterparty(null);
      setIsFormOpen(false);
      await refetch();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t("counterparties.errorSave")));
    } finally {
      setIsSubmitting(false);
    }
  }

  function openCreateForm() {
    setEditingCounterparty(null);
    form.reset(emptyFormState);
    setIsFormOpen(true);
  }

  function openEditForm(counterparty: CounterpartyDto) {
    setEditingCounterparty(counterparty);
    form.reset({
      description: counterparty.description ?? "",
      email: counterparty.email ?? "",
      fullName: counterparty.fullName,
      isActive: counterparty.isActive,
      phoneNumber: counterparty.phoneNumber ?? ""
    });
    setIsFormOpen(true);
  }

  async function handleDeleteConfirmed() {
    if (deletingCounterparty == null) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await deleteCounterparty(deletingCounterparty.id);
      if (editingCounterparty?.id === deletingCounterparty.id) {
        setEditingCounterparty(null);
        form.reset(emptyFormState);
        setIsFormOpen(false);
      }
      await refetch();
      setDeletingCounterparty(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t("counterparties.errorDelete")));
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
        {t("counterparties.filter")}
      </ActionButton>
      <ActionButton onClick={openCreateForm}>
        {t("counterparties.create")}
      </ActionButton>
    </Stack>
  );

  return (
    <DefaultLayout
      headerActions={headerActions}
      title={t("counterparties.title")}
    >
      <Stack spacing={3}>
        {errorMessage != null ? <Alert severity="error">{errorMessage}</Alert> : null}
        <CounterpartiesList
          counterparties={counterparties}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          onDelete={counterparty => {
            setDeletingCounterparty(counterparty);
          }}
          onEdit={openEditForm}
        />
      </Stack>
      <CounterpartyFormDrawer
        form={form}
        isEditMode={isEditMode}
        isOpen={isFormOpen}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (isSubmitting) {
            return;
          }

          setIsFormOpen(false);
          setEditingCounterparty(null);
          form.reset(emptyFormState);
        }}
        onSubmit={handleSubmit}
      />
      <ConfirmationDialog
        confirmLabel={t("counterparties.delete")}
        isConfirming={isSubmitting}
        message={deletingCounterparty == null
          ? ""
          : t("counterparties.deleteConfirm").replace("{name}", deletingCounterparty.fullName)}
        onClose={() => {
          if (isSubmitting) {
            return;
          }

          setDeletingCounterparty(null);
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
