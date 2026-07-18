import { Alert, Menu, MenuItem, Stack } from "@mui/material";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { ConfirmModal } from "../../../components/atoms/ConfirmModal";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { useSettings } from "../../settings/provider/SettingProvider";
import { TemplateFormDrawer } from "../components/settings/TemplateFormDrawer";
import { TemplatePopulateDrawer } from "../components/populate/TemplatePopulateDrawer";
import { TemplatesFilterDrawer } from "../components/TemplatesFilterDrawer";
import { TemplatesList } from "../components/TemplatesList";
import type { TemplateFilterParams } from "../dtos/TemplateDto";
import { useTemplatesLogic } from "../hooks/useTemplatesLogic";

export function TemplatesPage() {
  const { t } = useSettings();
  const [filters, setFilters] = useState<TemplateFilterParams>({
    isActive: true,
    name: "",
    templateType: "",
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [createMenuAnchor, setCreateMenuAnchor] = useState<null | HTMLElement>(null);

  const {
    banks,
    closeDeleteConfirm,
    closeForm,
    closePopulate,
    counterparties,
    currencies,
    deletingTemplate,
    errorMessage,
    form,
    handleCreate,
    handleDeleteConfirmed,
    handleEdit,
    handlePopulate,
    handleSubmit,
    isEditMode,
    isFormOpen,
    isLoading,
    isPopulateOpen,
    isSubmitting,
    openDeleteConfirm,
    populateTemplateId,
    templates,
  } = useTemplatesLogic(filters);

  const headerActions = (
    <Stack direction="row" spacing={1.25}>
      <ActionButton
        onClick={() => setIsFilterDrawerOpen(true)}
        variant="outlined"
      >
        {t("templates.filter")}
      </ActionButton>
      <ActionButton
        endIcon={<ChevronDown size={16} />}
        onClick={(event) => setCreateMenuAnchor(event.currentTarget)}
      >
        {t("templates.create")}
      </ActionButton>
      <Menu
        anchorEl={createMenuAnchor}
        onClose={() => setCreateMenuAnchor(null)}
        open={createMenuAnchor != null}
      >
        <MenuItem
          onClick={() => {
            setCreateMenuAnchor(null);
            handleCreate("CashFlow");
          }}
        >
          {t("templates.templateType.cashFlow")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCreateMenuAnchor(null);
            handleCreate("Transfer");
          }}
        >
          {t("templates.templateType.transfer")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCreateMenuAnchor(null);
            handleCreate("Exchange");
          }}
        >
          {t("templates.templateType.exchange")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCreateMenuAnchor(null);
            handleCreate("BankAccount");
          }}
        >
          {t("templates.templateType.bankAccount")}
        </MenuItem>
      </Menu>
    </Stack>
  );

  return (
    <DefaultLayout headerActions={headerActions} title={t("templates.title")}>
      <Stack spacing={3}>
        {errorMessage != null ? <Alert severity="error">{errorMessage}</Alert> : null}
        <TemplatesList
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          onDelete={(template) => openDeleteConfirm(template)}
          onEdit={(template) => {
            void handleEdit(template);
          }}
          onPopulate={(template) => {
            handlePopulate(template);
          }}
          templates={templates}
        />
      </Stack>

      <TemplateFormDrawer
        banks={banks}
        counterparties={counterparties}
        currencies={currencies}
        errorMessage={errorMessage}
        form={form}
        isEditMode={isEditMode}
        isOpen={isFormOpen}
        isSubmitting={isSubmitting}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <ConfirmModal
        confirmLabel={t("templates.delete")}
        isConfirming={isSubmitting}
        message={
          deletingTemplate == null
            ? ""
            : t("templates.deleteConfirm").replace(
                "{name}",
                deletingTemplate.name,
              )
        }
        onClose={closeDeleteConfirm}
        onConfirm={() => {
          void handleDeleteConfirmed();
        }}
        open={deletingTemplate !== null}
        title={t("templates.deleteTitle")}
      />

      <TemplatesFilterDrawer
        initialValues={filters}
        isOpen={isFilterDrawerOpen}
        onApply={(values) => {
          setFilters(values);
          setIsFilterDrawerOpen(false);
        }}
        onClose={() => setIsFilterDrawerOpen(false)}
      />

      <TemplatePopulateDrawer
        banks={banks}
        counterparties={counterparties}
        currencies={currencies}
        initialTemplateId={populateTemplateId ?? ""}
        isOpen={isPopulateOpen}
        onClose={closePopulate}
        onSaved={closePopulate}
      />
    </DefaultLayout>
  );
}
