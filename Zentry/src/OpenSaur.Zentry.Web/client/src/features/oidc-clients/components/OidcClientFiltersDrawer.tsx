import { useState } from "react";
import { CircularProgress, Stack, TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";

export type OidcClientFilterValues = {
  clientId: string;
};

type OidcClientFiltersDrawerProps = {
  initialValues: OidcClientFilterValues;
  isOpen: boolean;
  onApply: (values: OidcClientFilterValues) => Promise<void> | void;
  onClose: () => void;
};

const defaultFilterValues: OidcClientFilterValues = {
  clientId: ""
};

export function OidcClientFiltersDrawer({
  initialValues,
  isOpen,
  onApply,
  onClose
}: OidcClientFiltersDrawerProps) {
  const { control, handleSubmit, reset } = useForm<OidcClientFilterValues>({
    values: initialValues
  });
  const { t } = useSettings();
  const [isApplying, setIsApplying] = useState(false);

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} title={t("oidc.filterTitle")}>
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
          <Controller
            control={control}
            name="clientId"
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label={t("oidc.clientIdOrName")}
              />
            )}
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
