import { useForm } from "react-hook-form";
import { useCrudPageState } from "../../../components/hooks/useCrudPageState";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { useSettings } from "../../settings/provider/SettingProvider";
import { useTagsQuery } from "./useTagsQuery";
import { useCreateTagMutation } from "./useCreateTagMutation";
import { useUpdateTagMutation } from "./useUpdateTagMutation";
import { useDeleteTagMutation } from "./useDeleteTagMutation";
import type { TagFilterParams } from "../api/tagsApi";
import type { SaveTagDto, TagDto, TagFormValues } from "../dtos/TagDto";

const emptyFormState: TagFormValues = {
  name: "",
  matchingTerms: [],
  marker: false,
  isDefaultMaker: false,
};

function buildPayload(
  values: TagFormValues,
  isActive: boolean,
): SaveTagDto {
  return {
    isActive,
    isDefaultMaker: values.isDefaultMaker,
    marker: values.marker,
    matchingTerms: values.matchingTerms,
    name: values.name.trim(),
  };
}

export function useTagsLogic(filters: TagFilterParams) {
  const { t } = useSettings();
  const { data: tags = [], isLoading } = useTagsQuery(filters);
  const createTagMutation = useCreateTagMutation();
  const updateTagMutation = useUpdateTagMutation();
  const deleteTagMutation = useDeleteTagMutation();
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
  } = useCrudPageState<TagDto>();
  const form = useForm<TagFormValues>({
    defaultValues: emptyFormState,
  });

  async function handleSubmit(values: TagFormValues) {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (editingItem == null) {
        await createTagMutation.mutateAsync(buildPayload(values, true));
      } else {
        await updateTagMutation.mutateAsync({
          id: editingItem.id,
          payload: buildPayload(values, editingItem.isActive),
        });
      }

      form.reset(emptyFormState);
      setEditingItem(null);
      setIsFormOpen(false);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("tags.errorSave")));
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
      await deleteTagMutation.mutateAsync(deletingItem.id);
      if (editingItem?.id === deletingItem.id) {
        closeForm();
        form.reset(emptyFormState);
      }
      closeDeleteConfirm();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("tags.errorDelete")));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCreate() {
    form.reset(emptyFormState);
    setErrorMessage(null);
    openCreateForm();
  }

  function handleEdit(tag: TagDto) {
    setErrorMessage(null);
    form.reset({
      isDefaultMaker: tag.isDefaultMaker ?? false,
      matchingTerms: tag.matchingTerms,
      marker: tag.marker ?? false,
      name: tag.name,
    });
    openEditForm(tag);
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
    deletingTag: deletingItem,
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
    tags,
  };
}
