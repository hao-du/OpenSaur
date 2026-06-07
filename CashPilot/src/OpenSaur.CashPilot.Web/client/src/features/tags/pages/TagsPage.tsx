import { Alert, Stack } from "@mui/material";
import { AxiosError } from "axios";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { ConfirmModal } from "../../../components/atoms/ConfirmModal";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { SaveTagDto, TagDto } from "../dtos/TagDto";
import { useCreateTagMutation } from "../hooks/useCreateTagMutation";
import { useDeleteTagMutation } from "../hooks/useDeleteTagMutation";
import { useTagsQuery } from "../hooks/useTagsQuery";
import { useUpdateTagMutation } from "../hooks/useUpdateTagMutation";
import { TagFormDrawer } from "../components/TagFormDrawer";
import type { TagFormValues } from "../components/TagForm";
import { TagsList } from "../components/TagsList";
import { TagsFilterDrawer } from "../components/TagsFilterDrawer";

const emptyFormState: TagFormValues = {
  name: "",
  matchingTerms: [],
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

export function TagsPage() {
  const { t } = useSettings();
  const [filters, setFilters] = useState({
    isActive: true,
    name: "",
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const { data: tags = [], isLoading } = useTagsQuery(filters);
  const createTagMutation = useCreateTagMutation();
  const updateTagMutation = useUpdateTagMutation();
  const deleteTagMutation = useDeleteTagMutation();
  const [editingTag, setEditingTag] = useState<TagDto | null>(null);
  const [deletingTag, setDeletingTag] = useState<TagDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const form = useForm<TagFormValues>({
    defaultValues: emptyFormState,
  });
  const isEditMode = useMemo(() => editingTag != null, [editingTag]);

  async function handleSubmit(values: TagFormValues) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const payload: SaveTagDto = {
        name: values.name.trim(),
        isActive: true,
        matchingTerms: values.matchingTerms
          .map((x) => x.trim())
          .filter((x) => x.length > 0),
      };

      if (editingTag == null) {
        await createTagMutation.mutateAsync(payload);
      } else {
        await updateTagMutation.mutateAsync({ id: editingTag.id, payload });
      }

      form.reset(emptyFormState);
      setEditingTag(null);
      setIsFormOpen(false);
      } catch (error) {
      setErrorMessage(getErrorMessage(error, t("tags.errorSave")));
    } finally {
      setIsSubmitting(false);
    }
  }

  function openCreateForm() {
    setSuccessMessage(null);
    setEditingTag(null);
    form.reset(emptyFormState);
    setIsFormOpen(true);
  }

  function openEditForm(tag: TagDto) {
    setSuccessMessage(null);
    setEditingTag(tag);
    form.reset({
      name: tag.name,
      matchingTerms: tag.matchingTerms,
    });
    setIsFormOpen(true);
  }

  async function handleDeleteConfirmed() {
    if (deletingTag == null) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      await deleteTagMutation.mutateAsync(deletingTag.id);
      if (editingTag?.id === deletingTag.id) {
        setEditingTag(null);
        form.reset(emptyFormState);
        setIsFormOpen(false);
      }
      setDeletingTag(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t("tags.errorDelete")));
    } finally {
      setIsSubmitting(false);
    }
  }

  const headerActions = (
    <Stack direction="row" spacing={1.25}>
      <ActionButton onClick={() => setIsFilterDrawerOpen(true)} variant="outlined">
        {t("common.filter")}
      </ActionButton>
      <ActionButton onClick={openCreateForm}>{t("common.create")}</ActionButton>
    </Stack>
  );

  return (
    <DefaultLayout headerActions={headerActions} title={t("tags.title")}>
      <Stack spacing={2}>
        {errorMessage != null ? <Alert severity="error">{errorMessage}</Alert> : null}
        {successMessage != null ? <Alert severity="success">{successMessage}</Alert> : null}
        <TagsList
          tags={tags}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          onDelete={(tag) => {
            setDeletingTag(tag);
          }}
          onEdit={openEditForm}
        />
      </Stack>
      <TagFormDrawer
        form={form}
        isEditMode={isEditMode}
        isOpen={isFormOpen}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (isSubmitting) {
            return;
          }

          setIsFormOpen(false);
          setEditingTag(null);
          form.reset(emptyFormState);
        }}
        onSubmit={handleSubmit}
      />
      <ConfirmModal
        confirmLabel={t("common.delete")}
        isConfirming={isSubmitting}
        message={
          deletingTag == null
            ? ""
            : t("tags.deleteConfirm").replace("{name}", deletingTag.name)
        }
        onClose={() => {
          if (isSubmitting) {
            return;
          }

          setDeletingTag(null);
        }}
        onConfirm={() => {
          void handleDeleteConfirmed();
        }}
        open={deletingTag !== null}
        title={t("tags.deleteTitle")}
      />
      <TagsFilterDrawer
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
