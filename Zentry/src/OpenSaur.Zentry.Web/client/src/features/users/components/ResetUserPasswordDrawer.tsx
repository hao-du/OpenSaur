import { Alert, CircularProgress, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { MetaText } from "../../../components/atoms/MetaText";
import { Text } from "../../../components/atoms/Text";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";

type ResetUserPasswordDrawerProps = {
  errorMessage: string | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
  userName?: string;
};

type ResetUserPasswordFormValues = {
  password: string;
};

export function ResetUserPasswordDrawer({
  errorMessage,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  userName
}: ResetUserPasswordDrawerProps) {
  const { t } = useSettings();
  const { control, handleSubmit, reset } = useForm<ResetUserPasswordFormValues>({
    values: {
      password: ""
    }
  });

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} subtitle={userName ?? ""} title={t("users.resetPasswordTitle")}>
        <Stack
          component="form"
          noValidate
          onSubmit={handleSubmit(async values => {
            await onSubmit(values.password);
            reset({ password: "" });
          })}
          spacing={3}
          sx={layoutStyles.drawerBody}
        >
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
          <Text
            control={control}
            disabled={isSubmitting}
            label={t("users.newTemporaryPassword")}
            name="password"
            required
            rules={{
              minLength: {
                message: t("users.passwordMinLength"),
                value: 8
              },
              required: t("users.newTemporaryPasswordRequired")
            }}
            type="password"
          />
          <MetaText>
            {t("users.resetPasswordInfo")}
          </MetaText>
          <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
            <ActionButton onClick={onClose} type="button" variant="text">
              {t("action.cancel")}
            </ActionButton>
            <ActionButton
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress color="inherit" size={18} /> : undefined}
              type="submit"
            >
              {isSubmitting ? t("action.saving") : t("action.resetPassword")}
            </ActionButton>
          </Stack>
        </Stack>
    </DrawerPanel>
  );
}
