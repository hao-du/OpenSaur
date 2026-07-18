import { Autocomplete, Box, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { useMemo, useState } from "react";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { EyebrowText } from "../../../components/atoms/EyebrowText";
import { LabelText } from "../../../components/atoms/LabelText";
import { MetaText } from "../../../components/atoms/MetaText";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import type {
  UserForImpersonationByWorkspaceIdDto,
  UsersForImpersonationByWorkspaceIdDto
} from "../dtos/UsersForImpersonationByWorkspaceIdDto";
import { useSettings } from "../../settings/provider/SettingProvider";

type WorkspaceImpersonationDialogProps = {
  errorMessage: string | null;
  isLoading: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: { userId: string; workspaceId: string }) => Promise<void>;
  usersForImpersonation: UsersForImpersonationByWorkspaceIdDto | null;
};

export function WorkspaceImpersonationDialog({
  errorMessage,
  isLoading,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  usersForImpersonation
}: WorkspaceImpersonationDialogProps) {
  const { t } = useSettings();
  const [selectedUser, setSelectedUser] = useState<UserForImpersonationByWorkspaceIdDto | null>(null);
  const users = useMemo(() => usersForImpersonation?.users ?? [], [usersForImpersonation?.users]);

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    setSelectedUser(null);
    onClose();
  }

  async function handleSubmit() {
    if (selectedUser == null || usersForImpersonation == null) {
      return;
    }

    await onSubmit({
      userId: selectedUser.id,
      workspaceId: usersForImpersonation.workspaceId
    });
  }

  return (
    <Dialog fullWidth maxWidth="sm" onClose={handleClose} open={isOpen}>
      <DialogTitle>{t("workspaces.loginAs")}</DialogTitle>
      <DialogContent dividers>
        <EyebrowText sx={{ mb: 1 }}>
          {t("workspaces.workspace")}
        </EyebrowText>
        <PageTitleText sx={{ mb: 3 }} variant="h6">
          {usersForImpersonation?.workspaceName ?? ""}
        </PageTitleText>
        <Autocomplete
          disabled={isLoading || isSubmitting}
          getOptionLabel={option => option.userName}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          loading={isLoading}
          onChange={(_, nextValue) => {
            setSelectedUser(nextValue);
          }}
          options={users}
          renderInput={params => (
            <TextField
              {...params}
              error={errorMessage != null}
              helperText={errorMessage ?? undefined}
              label={t("users.user")}
              placeholder={t("roles.searchUsers")}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Box>
                <LabelText>{option.userName}</LabelText>
                <MetaText color="primary">{option.email}</MetaText>
              </Box>
            </Box>
          )}
          value={selectedUser}
        />
      </DialogContent>
      <DialogActions>
        <ActionButton disabled={isSubmitting} onClick={handleClose} variant="text">{t("action.cancel")}</ActionButton>
        <ActionButton disabled={selectedUser == null || isSubmitting} onClick={() => { void handleSubmit(); }}>
          {t("action.continue")}
        </ActionButton>
      </DialogActions>
    </Dialog>
  );
}
