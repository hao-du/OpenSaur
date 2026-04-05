import { useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  Button,
  CircularProgress,
  Divider,
  Stack,
  Typography
} from "@mui/material";
import {
  ControlledCheckbox,
  ControlledTextArea,
  ControlledTextField
} from "../../../components/molecules/controlled";
import { usePreferences } from "../../preferences/PreferenceProvider";

type OidcClientFormValues = {
  appPathBase: string;
  clientId: string;
  clientSecret: string;
  description: string;
  displayName: string;
  isActive: boolean;
  originsText: string;
  scope: string;
};

type OidcClientFormProps = {
  errorMessage: string | null;
  initialValues: OidcClientFormValues;
  isEditMode: boolean;
  isSubmitting: boolean;
  onSubmit: (values: {
    appPathBase: string;
    clientId: string;
    clientSecret: string;
    description: string;
    displayName: string;
    isActive: boolean;
    origins: string[];
    scope: string;
  }) => Promise<void>;
};

function splitOrigins(originsText: string) {
  return originsText
    .split(/\r?\n/)
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
}

export function OidcClientForm({
  errorMessage,
  initialValues,
  isEditMode,
  isSubmitting,
  onSubmit
}: OidcClientFormProps) {
  const { t } = usePreferences();
  const {
    control,
    handleSubmit,
    watch
  } = useForm<OidcClientFormValues>({
    values: initialValues
  });
  const originsText = watch("originsText");
  const originPreview = useMemo(
    () => splitOrigins(originsText),
    [originsText]
  );

  return (
    <Stack
      component="form"
      noValidate
      onSubmit={handleSubmit(async values => {
        await onSubmit({
          appPathBase: values.appPathBase,
          clientId: values.clientId,
          clientSecret: values.clientSecret,
          description: values.description,
          displayName: values.displayName,
          isActive: values.isActive,
          origins: splitOrigins(values.originsText),
          scope: values.scope
        });
      })}
      spacing={3}
    >
      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      <Stack spacing={2}>
        <Typography variant="h6">{t("oidcClients.form.client")}</Typography>
        <ControlledTextField
          control={control}
          disabled={isSubmitting}
          label={t("oidcClients.form.displayName")}
          name="displayName"
          rules={{
            required: t("oidcClients.form.displayNameRequired")
          }}
        />
        <ControlledTextField
          control={control}
          disabled={isSubmitting}
          label={t("oidcClients.form.clientId")}
          name="clientId"
          rules={{
            required: t("oidcClients.form.clientIdRequired")
          }}
        />
        <ControlledTextField
          control={control}
          disabled={isSubmitting}
          label={t("oidcClients.form.clientSecret")}
          name="clientSecret"
          rules={isEditMode
            ? undefined
            : {
                required: t("oidcClients.form.clientSecretRequired")
              }}
        />
        <Typography color="text.secondary" variant="body2">
          {isEditMode ? t("oidcClients.form.clientSecretOptional") : t("oidcClients.form.clientSecretRequired")}
        </Typography>
        <ControlledTextField
          control={control}
          disabled={isSubmitting}
          label={t("oidcClients.form.scope")}
          name="scope"
          rules={{
            required: t("oidcClients.form.scopeRequired")
          }}
        />
        <Typography color="text.secondary" variant="body2">
          {t("oidcClients.form.scopeHelp")}
        </Typography>
        <ControlledTextField
          control={control}
          disabled={isSubmitting}
          label={t("oidcClients.form.appPathBase")}
          name="appPathBase"
          rules={{
            required: t("oidcClients.form.appPathBaseRequired")
          }}
        />
        <Typography color="text.secondary" variant="body2">
          {t("oidcClients.form.appPathBaseHelp")}
        </Typography>
        <ControlledTextArea
          control={control}
          disabled={isSubmitting}
          label={t("oidcClients.form.origins")}
          minRows={4}
          name="originsText"
          rules={{
            required: t("oidcClients.form.originsRequired"),
            validate: value => splitOrigins(String(value)).length > 0 || t("oidcClients.form.originsRequired")
          }}
        />
        <Typography color="text.secondary" variant="body2">
          {t("oidcClients.form.originsHelp")}
        </Typography>
        {originPreview.length > 0 ? (
          <Alert severity="info">
            <strong>{t("oidcClients.form.originPreviewTitle")}</strong>
            <br />
            {originPreview.join(", ")}
          </Alert>
        ) : null}
        <ControlledTextArea
          control={control}
          disabled={isSubmitting}
          label={t("oidcClients.form.description")}
          minRows={3}
          name="description"
        />
        {isEditMode ? (
          <ControlledCheckbox
            control={control}
            disabled={isSubmitting}
            inputProps={{ "aria-label": t("oidcClients.form.activeAriaLabel") }}
            label={t("oidcClients.form.activeLabel")}
            name="isActive"
          />
        ) : null}
      </Stack>
      <Divider />
      <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
        <Button
          aria-busy={isSubmitting}
          disabled={isSubmitting}
          startIcon={isSubmitting
            ? <CircularProgress color="inherit" size={18} />
            : undefined}
          type="submit"
          variant="contained"
        >
          {isSubmitting ? t("common.saving") : t("common.save")}
        </Button>
      </Stack>
    </Stack>
  );
}
