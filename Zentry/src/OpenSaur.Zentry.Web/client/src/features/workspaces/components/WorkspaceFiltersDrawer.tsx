import { useState } from "react";
import { CircularProgress, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DropDown } from "../../../components/atoms/DropDown";
import { Text } from "../../../components/atoms/Text";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";

export type WorkspaceFilterValues = {
  search: string;
  status: "active" | "all" | "inactive";
};

type WorkspaceFiltersDrawerProps = {
  initialValues: WorkspaceFilterValues;
  isOpen: boolean;
  onApply: (values: WorkspaceFilterValues) => Promise<void> | void;
  onClose: () => void;
};

const defaultFilterValues: WorkspaceFilterValues = {
  search: "",
  status: "active"
};

export function WorkspaceFiltersDrawer({
  initialValues,
  isOpen,
  onApply,
  onClose
}: WorkspaceFiltersDrawerProps) {
  const { control, handleSubmit, reset } = useForm<WorkspaceFilterValues>({
    values: initialValues
  });
  const { t } = useSettings();
  const [isApplying, setIsApplying] = useState(false);

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} title={t("workspaces.filterTitle")}>
        <Stack
          component="form"
          noValidate
          onSubmit={handleSubmit(async values => {
            setIsApplying(true);
            try {
              await Promise.resolve(onApply(values));
            } finally {
              setIsApplying(false);
            }
          })}
          spacing={3}
          sx={layoutStyles.drawerBody}
        >
          <Text control={control} label={t("workspaces.filterSearch")} name="search" />
          <DropDown
            control={control}
            label={t("common.status")}
            name="status"
            options={[
              { label: t("common.active"), value: "active" },
              { label: t("common.inactive"), value: "inactive" },
              { label: t("common.all"), value: "all" }
            ]}
          />
          <Stack direction="row" justifyContent="space-between" spacing={1.5} sx={layoutStyles.formFooterRow}>
            <ActionButton
              onClick={() => {
                reset(defaultFilterValues);
              }}
              type="button"
              variant="text"
            >
              {t("action.resetFilters")}
            </ActionButton>
            <ActionButton
              disabled={isApplying}
              startIcon={isApplying ? <CircularProgress color="inherit" size={18} /> : undefined}
              type="submit"
            >
              {isApplying ? t("action.applying") : t("action.apply")}
            </ActionButton>
          </Stack>
        </Stack>
    </DrawerPanel>
  );
}
