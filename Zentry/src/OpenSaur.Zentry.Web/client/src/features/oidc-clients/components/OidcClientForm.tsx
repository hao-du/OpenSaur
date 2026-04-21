import { Alert, Button, CircularProgress, Divider, Stack, Typography } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { DropDown } from "../../../components/atoms/DropDown";
import { Text } from "../../../components/atoms/Text";
import { TextArea } from "../../../components/atoms/TextArea";

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
        <Typography variant="h6">Client</Typography>
        <Text
          control={control}
          disabled={isSubmitting}
          helperText="How this client appears in Zentry."
          label="Display name"
          name="displayName"
          required
          rules={{ required: "Display name is required." }}
        />
        <Text
          control={control}
          disabled={isSubmitting}
          label="Client ID"
          name="clientId"
          required
          rules={{ required: "Client ID is required." }}
        />
        <DropDown
          control={control}
          disabled={isSubmitting}
          helperText="Public clients use authorization code + PKCE without a client secret."
          label="Client type"
          name="clientType"
          options={[
            { label: "Public (PKCE)", value: "public" },
            { label: "Confidential", value: "confidential" }
          ]}
          required
          rules={{ required: "Client type is required." }}
        />
        <Text
          key={isPublicClient ? "client-secret-public" : "client-secret-confidential"}
          control={control}
          disabled={isSubmitting || isPublicClient}
          helperText={isPublicClient
            ? "Public PKCE clients do not use a client secret."
            : isEditMode
              ? "Leave blank to keep the current client secret."
              : "Client secret is required for confidential clients."}
          label="Client secret"
          name="clientSecret"
          required={!isEditMode && !isPublicClient}
          rules={isEditMode || isPublicClient ? undefined : { required: "Client secret is required." }}
          shouldUnregister
          type="password"
        />
        <Text
          control={control}
          disabled={isSubmitting}
          helperText="Space-separated scopes issued to this application."
          label="Scope"
          name="scope"
          required
          rules={{ required: "Scope is required." }}
        />
        <TextArea
          control={control}
          disabled={isSubmitting}
          helperText="One absolute redirect URI per line."
          label="Redirect URIs"
          name="redirectUrisText"
          required
          rules={{
            required: "At least one redirect URI is required.",
            validate: value => splitUris(String(value)).length > 0 || "At least one redirect URI is required."
          }}
        />
        <TextArea
          control={control}
          disabled={isSubmitting}
          helperText="Optional absolute post-logout redirect URI per line."
          label="Post-logout redirect URIs"
          name="postLogoutRedirectUrisText"
          rules={{}}
        />
        {redirectUriPreview.length > 0 ? (
          <Alert severity="info">
            Redirect URIs: {redirectUriPreview.join(", ")}
          </Alert>
        ) : null}
        {postLogoutRedirectUriPreview.length > 0 ? (
          <Alert severity="info">
            Post-logout redirect URIs: {postLogoutRedirectUriPreview.join(", ")}
          </Alert>
        ) : null}
      </Stack>
      <Divider />
      <Stack direction="row" justifyContent="flex-end">
        <Button
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress color="inherit" size={18} /> : undefined}
          type="submit"
          variant="contained"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </Stack>
    </Stack>
  );
}
