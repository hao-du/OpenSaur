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
import { X } from "lucide-react";
import { ControlledTextField } from "../../../components/molecules/controlled";
import { usePreferences } from "../../preferences/PreferenceProvider";

export type RoleFilterValues = {
  search: string;
  status: "active" | "all" | "inactive";
};

type RoleFiltersDrawerProps = {
  initialValues: RoleFilterValues;
  isOpen: boolean;
  onApply: (values: RoleFilterValues) => Promise<void> | void;
  onClose: () => void;
};

const defaultFilterValues: RoleFilterValues = {
  search: "",
  status: "active"
};

export function RoleFiltersDrawer({
  initialValues,
  isOpen,
  onApply,
  onClose
}: RoleFiltersDrawerProps) {
  const { t } = usePreferences();
  const {
    control,
    handleSubmit,
    reset
  } = useForm<RoleFilterValues>({
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
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
        >
          <Typography component="h2" variant="h5">
            {t("roles.filters.title")}
          </Typography>
          <IconButton
            aria-label={t("roles.filters.close")}
            onClick={onClose}
          >
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
          <ControlledTextField
            control={control}
            label={t("roles.filters.search")}
            name="search"
          />
          <ControlledTextField
            control={control}
            label={t("roles.filters.status")}
            name="status"
            select
          >
            <MenuItem value="all">{t("common.all")}</MenuItem>
            <MenuItem value="active">{t("common.active")}</MenuItem>
            <MenuItem value="inactive">{t("common.inactive")}</MenuItem>
          </ControlledTextField>
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
