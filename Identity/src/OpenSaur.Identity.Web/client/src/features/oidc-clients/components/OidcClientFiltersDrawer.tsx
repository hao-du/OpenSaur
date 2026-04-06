import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Stack,
  Typography
} from "@mui/material";
import { X } from "../../../shared/icons";
import {
  FormFieldBlock,
  FormFieldList
} from "../../../components/molecules";
import { ControlledTextField } from "../../../components/molecules/controlled";
import { usePreferences } from "../../preferences/PreferenceProvider";
import type { OidcClientFilterValues } from "../utils/filterOidcClients";

type OidcClientFiltersDrawerProps = {
  initialValues: OidcClientFilterValues;
  isOpen: boolean;
  onApply: (values: OidcClientFilterValues) => Promise<void> | void;
  onClose: () => void;
};

const defaultFilterValues: OidcClientFilterValues = {
  clientId: "",
  status: "active"
};

export function OidcClientFiltersDrawer({
  initialValues,
  isOpen,
  onApply,
  onClose
}: OidcClientFiltersDrawerProps) {
  const { t } = usePreferences();
  const {
    control,
    handleSubmit,
    reset
  } = useForm<OidcClientFilterValues>({
    values: initialValues
  });
  const [isApplying, setIsApplying] = useState(false);

  return (
    <Drawer
      anchor="right"
      onClose={onClose}
      open={isOpen}
      sx={{
        "& .MuiDrawer-paper": {
          p: 3,
          width: { sm: 480, xs: "100%" }
        }
      }}
    >
      <Stack spacing={3} sx={{ height: "100%" }}>
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <Typography component="h2" variant="h5">
            {t("oidcClients.filters.title")}
          </Typography>
          <IconButton aria-label={t("oidcClients.filters.close")} onClick={onClose}>
            <X size={18} />
          </IconButton>
        </Stack>
        <Divider />
        <Stack
          component="form"
          noValidate
          onSubmit={handleSubmit(async values => {
            setIsApplying(true);
            try {
              await new Promise(resolve => {
                window.setTimeout(resolve, 0);
              });
              await onApply(values);
            } finally {
              setIsApplying(false);
            }
          })}
          spacing={3}
          sx={{ flex: 1 }}
        >
          <FormFieldList>
            <FormFieldBlock>
              <ControlledTextField
                control={control}
                label={t("oidcClients.filters.clientId")}
                name="clientId"
              />
            </FormFieldBlock>
            <FormFieldBlock>
              <ControlledTextField
                control={control}
                label={t("oidcClients.filters.status")}
                name="status"
                select
              >
                <MenuItem value="all">{t("common.all")}</MenuItem>
                <MenuItem value="active">{t("common.active")}</MenuItem>
                <MenuItem value="inactive">{t("common.inactive")}</MenuItem>
              </ControlledTextField>
            </FormFieldBlock>
          </FormFieldList>
          <Stack
            direction="row"
            justifyContent="space-between"
            spacing={1.5}
            sx={{ mt: "auto" }}
          >
            <Button
              onClick={() => {
                reset(defaultFilterValues);
              }}
              type="button"
              variant="text"
            >
              {t("common.resetFilters")}
            </Button>
            <Button
              aria-busy={isApplying}
              disabled={isApplying}
              startIcon={isApplying
                ? <CircularProgress color="inherit" size={18} />
                : undefined}
              type="submit"
              variant="contained"
            >
              {isApplying ? t("common.applyingFilters") : t("common.applyFilters")}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Drawer>
  );
}
