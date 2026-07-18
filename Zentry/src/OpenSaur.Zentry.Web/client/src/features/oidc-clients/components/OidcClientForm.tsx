import { Alert, CircularProgress, Divider, Stack } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DropDown } from "../../../components/atoms/DropDown";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { Text } from "../../../components/atoms/Text";
import { TextArea } from "../../../components/atoms/TextArea";
import { useSettings } from "../../settings/provider/SettingProvider";

type OidcClientFormValues = {
  clientId: string;
  clientType: string;
  clientSecret: string;
  displayName: string;
  postLogoutRedirectUrisText: string;
  redirectUrisText: string;
  scope: string;
};

type OidcClientFormProps = {
  errorMessage: string | null;
  initialValues: OidcClientFormValues;
  isEditMode: boolean;
  isSubmitting: boolean;
  onSubmit: (values: {
    clientId: string;
    clientType: string;
    clientSecret: string;
    displayName: string;
    postLogoutRedirectUris: string[];
    redirectUris: string[];
    scope: string;
  }) => Promise<void>;
};

function splitUris(urisText: string) {
  return urisText
    .split(/\r?\n/)
    .map(uri => uri.trim())
    .filter(uri => uri.length > 0);
}

export function OidcClientForm({
  errorMessage,
  initialValues,
  isEditMode,
  isSubmitting,
  onSubmit
}: OidcClientFormProps) {
  const { t } = useSettings();
  const { clearErrors, control, handleSubmit, resetField, setValue, watch } = useForm<OidcClientFormValues>({
    values: initialValues
  });
  const clientType = watch("clientType");
  const isPublicClient = clientType === "public";
  const redirectUriPreview = splitUris(watch("redirectUrisText"));
  const postLogoutRedirectUriPreview = splitUris(watch("postLogoutRedirectUrisText"));

  useEffect(() => {
    if (isPublicClient) {
      resetField("clientSecret", { defaultValue: "" });
      setValue("clientSecret", "", { shouldDirty: false, shouldValidate: false, shouldTouch: false });
      clearErrors("clientSecret");
    }
  }, [clearErrors, isPublicClient, resetField, setValue]);

  return (
    <Stack
      component="form"
      noValidate
      onSubmit={handleSubmit(async values => {
        await onSubmit({
          clientId: values.clientId,
          clientType: values.clientType,
          clientSecret: values.clientType === "public" ? "" : values.clientSecret,
          displayName: values.displayName,
          postLogoutRedirectUris: splitUris(values.postLogoutRedirectUrisText),
          redirectUris: splitUris(values.redirectUrisText),
          scope: values.scope
        });
      })}
      spacing={3}
    >
      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      <Stack spacing={2}>
        <PageTitleText variant="h6">{t("oidc.client")}</PageTitleText>
        <Text
          control={control}
          disabled={isSubmitting}
          helperText={t("oidc.displayNameHelper")}
          label={t("oidc.displayName")}
          name="displayName"
          required
          rules={{ required: t("oidc.displayNameRequired") }}
        />
        <Text
          control={control}
          disabled={isSubmitting}
          label="Client ID"
          name="clientId"
          required
          rules={{ required: t("oidc.clientIdRequired") }}
        />
        <DropDown
          control={control}
          disabled={isSubmitting}
          helperText={t("oidc.publicPkceHelper")}
          label={t("oidc.clientType")}
          name="clientType"
          options={[
            { label: t("oidc.publicPkce"), value: "public" },
            { label: t("oidc.confidential"), value: "confidential" }
          ]}
          required
          rules={{ required: t("oidc.clientTypeRequired") }}
        />
        <Text
          key={isPublicClient ? "client-secret-public" : "client-secret-confidential"}
          control={control}
          disabled={isSubmitting || isPublicClient}
          helperText={isPublicClient
            ? t("oidc.publicClientSecretHelper")
            : isEditMode
              ? t("oidc.keepSecretHelper")
              : t("oidc.clientSecretRequiredForConfidential")}
          label={t("oidc.clientSecret")}
          name="clientSecret"
          required={!isEditMode && !isPublicClient}
          rules={isEditMode || isPublicClient ? undefined : { required: t("oidc.clientSecretRequired") }}
          shouldUnregister
          type="password"
        />
        <Text
          control={control}
          disabled={isSubmitting}
          helperText={t("oidc.scopeHelper")}
          label={t("auth.scope")}
          name="scope"
          required
          rules={{ required: t("oidc.scopeRequired") }}
        />
        <TextArea
          control={control}
          disabled={isSubmitting}
          helperText={t("oidc.redirectUrisHelper")}
          label={t("oidc.redirectUris")}
          name="redirectUrisText"
          required
          rules={{
            required: t("oidc.redirectUrisRequired"),
            validate: value => splitUris(String(value)).length > 0 || t("oidc.redirectUrisRequired")
          }}
        />
        <TextArea
          control={control}
          disabled={isSubmitting}
          helperText={t("oidc.postLogoutRedirectUrisHelper")}
          label={t("oidc.postLogoutRedirectUris")}
          name="postLogoutRedirectUrisText"
          rules={{}}
        />
        {redirectUriPreview.length > 0 ? (
          <Alert severity="info">
            {t("oidc.redirectUris")}: {redirectUriPreview.join(", ")}
          </Alert>
        ) : null}
        {postLogoutRedirectUriPreview.length > 0 ? (
          <Alert severity="info">
            {t("oidc.postLogoutRedirectUris")}: {postLogoutRedirectUriPreview.join(", ")}
          </Alert>
        ) : null}
      </Stack>
      <Divider />
      <Stack direction="row" justifyContent="flex-end">
        <ActionButton
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress color="inherit" size={18} /> : undefined}
          type="submit"
        >
          {isSubmitting ? t("action.saving") : t("action.save")}
        </ActionButton>
      </Stack>
    </Stack>
  );
}
