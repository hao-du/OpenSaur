import { Alert, CircularProgress, Divider, Paper, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { BodyText } from "../../../components/atoms/BodyText";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { MetaText } from "../../../components/atoms/MetaText";
import { MultiSelect } from "../../../components/atoms/MultiSelect";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { Text } from "../../../components/atoms/Text";
import { TextArea } from "../../../components/atoms/TextArea";
import type { AssignableWorkspaceRoleDto } from "../dtos/AssignableWorkspaceRoleDto";
import { useSettings } from "../../settings/provider/SettingProvider";

export type WorkspaceFormValues = {
  description: string;
  isActive: boolean;
  maxActiveUsers: string;
  name: string;
  selectedRoleIds: string[];
};

type WorkspaceFormProps = {
  availableRoles: AssignableWorkspaceRoleDto[];
  errorMessage: string | null;
  initialValues: WorkspaceFormValues;
  isEditMode: boolean;
  isSubmitting: boolean;
  onSubmit: (values: WorkspaceFormValues) => Promise<void>;
};

export function WorkspaceForm({
  availableRoles,
  errorMessage,
  initialValues,
  isEditMode,
  isSubmitting,
  onSubmit
}: WorkspaceFormProps) {
  const { t } = useSettings();
  const { control, handleSubmit } = useForm<WorkspaceFormValues>({
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
      <Text
        control={control}
        disabled={isSubmitting}
        label={t("workspaces.workspaceName")}
        name="name"
        required
        rules={{ required: t("workspaces.workspaceNameRequired") }}
      />
      <TextArea
        control={control}
        disabled={isSubmitting}
        label={t("common.description")}
        name="description"
      />
      <Text
        control={control}
        disabled={isSubmitting}
        helperText={t("workspaces.leaveBlankLimit")}
        label={t("workspaces.maxActiveUsersField")}
        name="maxActiveUsers"
        rules={{
          validate: value => {
            const normalizedValue = String(value ?? "").trim();
            if (normalizedValue.length === 0) {
              return true;
            }

            const parsedValue = Number(normalizedValue);
            return Number.isInteger(parsedValue) && parsedValue >= 0
              ? true
              : t("workspaces.maxActiveUsersInvalid");
          }
        }}
        type="number"
      />
      <Divider />
      <Stack spacing={2}>
        <PageTitleText variant="h6">{t("workspaces.assignedRoles")}</PageTitleText>
        {availableRoles.length === 0 ? (
          <Paper elevation={0} variant="outlined">
            <Stack spacing={1.5} sx={{ p: 2 }}>
              <BodyText color="text.primary">{t("workspaces.noAssignableRoles")}</BodyText>
              <MetaText>
                {t("workspaces.createActiveRoles")}
              </MetaText>
            </Stack>
          </Paper>
        ) : (
          <MultiSelect
            control={control}
            disabled={isSubmitting}
            label={t("workspaces.assignedRoles")}
            name="selectedRoleIds"
            options={availableRoles.map(role => ({
              description: role.description,
              label: role.name,
              value: role.id
            }))}
            placeholder={t("workspaces.searchActiveRoles")}
          />
        )}
      </Stack>
      {isEditMode ? (
        <CheckBox
          control={control}
          disabled={isSubmitting}
          label={t("workspaces.workspaceIsActive")}
          name="isActive"
        />
      ) : null}
      <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
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
