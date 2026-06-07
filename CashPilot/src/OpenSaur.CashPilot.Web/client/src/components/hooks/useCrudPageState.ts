import { useState } from "react";

export function useCrudPageState<TItem>() {
  const [editingItem, setEditingItem] = useState<TItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<TItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEditMode = editingItem != null;

  function openCreateForm() {
    setEditingItem(null);
    setIsFormOpen(true);
  }

  function openEditForm(item: TItem) {
    setEditingItem(item);
    setIsFormOpen(true);
  }

  function openDeleteConfirm(item: TItem) {
    setDeletingItem(item);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingItem(null);
  }

  function closeDeleteConfirm() {
    setDeletingItem(null);
  }

  function resetForDeletedItem() {
    setEditingItem(null);
    setIsFormOpen(false);
  }

  return {
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
    resetForDeletedItem,
    setEditingItem,
    setErrorMessage,
    setIsFormOpen,
    setIsSubmitting,
    setDeletingItem,
  };
}
