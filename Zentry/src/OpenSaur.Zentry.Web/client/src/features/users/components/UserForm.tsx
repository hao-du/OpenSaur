import { Alert, CircularProgress, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { Text } from "../../../components/atoms/Text";
import { TextArea } from "../../../components/atoms/TextArea";
import { useSettings } from "../../settings/provider/SettingProvider";

export type UserFormValues = {
  description: string;
  email: string;
  firstName: string;
  isActive: boolean;
  lastName: string;
  password: string;
  requirePasswordChange: boolean;
  userName: string;
};

type UserFormProps = {
  errorMessage: string | null;
  initialValues: UserFormValues;
  isEditMode: boolean;
  isSubmitting: boolean;
  isSyncing?: boolean;
  onSync?: () => Promise<void>;
  onSubmit: (values: UserFormValues) => Promise<void>;
  syncErrorMessage?: string | null;
  syncSuccessMessage?: string | null;
};

export function UserForm({
  errorMessage,
  initialValues,
  isEditMode,
  isSubmitting,
  isSyncing = false,
  onSync,
  onSubmit,
  syncErrorMessage,
  syncSuccessMessage
}: UserFormProps) {
  const { t } = useSettings();
  const { control, handleSubmit } = useForm<UserFormValues>({
    values: initialValues
  });

  return (
    <Stack
      component="form"
      noValidate
      onSubmit={handleSubmit(async values => {
        await onSubmit(values);
      })}
      spacing={3}
    >
      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      {syncErrorMessage ? <Alert severity="error">{syncErrorMessage}</Alert> : null}
      {syncSuccessMessage ? <Alert severity="success">{syncSuccessMessage}</Alert> : null}
      <Text
        control={control}
        disabled={isSubmitting}
        label={t("users.userName")}
        name="userName"
        required
        rules={{ required: t("users.userNameRequired") }}
      />
      <Text
        control={control}
        disabled={isSubmitting}
        label={t("common.email")}
        name="email"
        required
        rules={{ required: t("users.emailRequired") }}
        type="email"
      />
      <Text control={control} disabled={isSubmitting} label={t("users.firstName")} name="firstName" />
      <Text control={control} disabled={isSubmitting} label={t("users.lastName")} name="lastName" />
      <TextArea control={control} disabled={isSubmitting} label={t("common.description")} name="description" />
      {!isEditMode ? (
        <Text
          control={control}
          disabled={isSubmitting}
          label={t("users.temporaryPassword")}
          name="password"
          required
          rules={{
            minLength: {
              message: t("users.passwordMinLength"),
              value: 8
            },
            required: t("users.temporaryPasswordRequired")
          }}
          type="password"
        />
      ) : null}
      <CheckBox
        control={control}
        disabled={isSubmitting}
        label={t("users.requirePasswordChange")}
        name="requirePasswordChange"
      />
      {isEditMode ? (
        <CheckBox
          control={control}
          disabled={isSubmitting}
          label={t("users.userIsActive")}
          name="isActive"
        />
      ) : null}
      <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
        {isEditMode && onSync ? (
          <ActionButton
            color="secondary"
            disabled={isSubmitting || isSyncing}
            onClick={async e => {
              e.preventDefault();
              await onSync();
            }}
            startIcon={isSyncing ? <CircularProgress color="inherit" size={18} /> : undefined}
            type="button"
            variant="outlined"
          >
            {isSyncing ? t("action.syncing") : t("action.sync")}
          </ActionButton>
        ) : null}
        <ActionButton
          disabled={isSubmitting || isSyncing}
          startIcon={isSubmitting ? <CircularProgress color="inherit" size={18} /> : undefined}
          type="submit"
        >
          {isSubmitting ? t("action.saving") : t("action.save")}
        </ActionButton>
      </Stack>
    </Stack>
  );
}
