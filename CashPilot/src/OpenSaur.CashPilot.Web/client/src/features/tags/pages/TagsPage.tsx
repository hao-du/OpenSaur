import { Alert, Stack } from "@mui/material";
import { useState } from "react";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { ConfirmModal } from "../../../components/atoms/ConfirmModal";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { useSettings } from "../../settings/provider/SettingProvider";
import { TagFormDrawer } from "../components/TagFormDrawer";
import { TagsList } from "../components/TagsList";
import { TagsFilterDrawer } from "../components/TagsFilterDrawer";
import { useTagsLogic } from "../hooks/useTagsLogic";

export function TagsPage() {
  const { t } = useSettings();
  const [filters, setFilters] = useState({
    isActive: true,
    name: "",
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const {
    closeDeleteConfirm,
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
    deletingTag,
    errorMessage,
    tags,
    closeForm,
  } = useTagsLogic(filters);

  const headerActions = (
    <Stack direction="row" spacing={1.25}>
      <ActionButton onClick={() => setIsFilterDrawerOpen(true)} variant="outlined">
        {t("common.filter")}
      </ActionButton>
      <ActionButton onClick={handleCreate}>
        {t("common.create")}
      </ActionButton>
    </Stack>
  );

  return (
    <DefaultLayout headerActions={headerActions} title={t("tags.title")}>
      <Stack spacing={2}>
        {errorMessage != null ? <Alert severity="error">{errorMessage}</Alert> : null}
        <TagsList
          tags={tags}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          onDelete={(tag) => {
            openDeleteConfirm(tag);
          }}
          onEdit={(tag) => {
            handleEdit(tag);
          }}
        />
      </Stack>
      <TagFormDrawer
        form={form}
        isEditMode={isEditMode}
        isOpen={isFormOpen}
        isSubmitting={isSubmitting}
        onClose={closeForm}
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
          closeDeleteConfirm();
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
