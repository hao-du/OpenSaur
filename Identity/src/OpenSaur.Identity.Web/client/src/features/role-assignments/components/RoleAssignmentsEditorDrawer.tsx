import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { X } from "../../../shared/icons";
import {
  FormFieldBlock,
  FormFieldList,
  FormSupportText
} from "../../../components/molecules";
import type { RoleSummary } from "../../roles/types";
import type {
  AssignmentCandidate,
  RoleAssignmentSummary
} from "../types";
import { usePreferences } from "../../preferences/PreferenceProvider";

type RoleAssignmentsEditorDrawerProps = {
  assignmentCandidates: AssignmentCandidate[];
  assignmentErrorMessage: string | null;
  assignments: RoleAssignmentSummary[];
  isLoadingCandidates: boolean;
  isLoadingAssignments: boolean;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: { roleId: string; selectedUserIds: string[]; }) => Promise<void>;
  role: RoleSummary | null;
};

export function RoleAssignmentsEditorDrawer({
  assignmentCandidates,
  assignmentErrorMessage,
  assignments,
  isLoadingAssignments,
  isLoadingCandidates,
  isOpen,
  isSaving,
  onClose,
  onSubmit,
  role
}: RoleAssignmentsEditorDrawerProps) {
  const { t } = usePreferences();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedUserIds(assignments.filter(assignment => assignment.isActive).map(assignment => assignment.userId));
    }
  }, [assignments, isOpen, role?.id]);

  const selectedUsers = useMemo(() => {
    return selectedUserIds
      .map(userId => assignmentCandidates.find(candidate => candidate.userId === userId)
        ?? assignments.find(assignment => assignment.userId === userId))
      .filter(candidate => candidate !== undefined);
  }, [assignmentCandidates, assignments, selectedUserIds]);

  const availableCandidates = assignmentCandidates.filter(
    candidate => !selectedUserIds.includes(candidate.userId)
  );

  async function handleSubmit() {
    if (!role) {
      return;
    }

    await onSubmit({
      roleId: role.id,
      selectedUserIds
    });
  }

  return (
    <Drawer
      anchor="right"
      onClose={onClose}
      open={isOpen}
      sx={{
        "& .MuiDrawer-paper": {
          p: 3,
          width: { sm: 560, xs: "100%" }
        }
      }}
    >
      <Stack spacing={3} sx={{ height: "100%" }}>
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <Typography component="h2" variant="h5">
            {t("roleAssignments.drawer.assignedUsers")}
          </Typography>
          <IconButton aria-label={t("roleAssignments.drawer.close")} onClick={onClose}>
            <X size={18} />
          </IconButton>
        </Stack>
        <Divider />
        {isLoadingAssignments || isLoadingCandidates ? (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ flex: 1 }}>
            <CircularProgress size={28} />
            <FormSupportText>{t("roleAssignments.drawer.loading")}</FormSupportText>
          </Stack>
        ) : (
          <Stack spacing={3} sx={{ flex: 1 }}>
            {assignmentErrorMessage ? (
              <Alert severity="error">
                {assignmentErrorMessage}
              </Alert>
            ) : null}
            <FormFieldList>
              <FormFieldBlock>
                <Autocomplete
                  autoHighlight
                  disabled={!role}
                  filterOptions={(availableUsers, state) => {
                    const normalizedInput = state.inputValue.trim().toLowerCase();
                    if (!normalizedInput) {
                      return availableUsers;
                    }

                    return availableUsers.filter(user =>
                      user.userName.toLowerCase().includes(normalizedInput)
                      || user.email.toLowerCase().includes(normalizedInput)
                      || user.workspaceName.toLowerCase().includes(normalizedInput));
                  }}
                  fullWidth
                  getOptionLabel={option => option.userName}
                  isOptionEqualToValue={(option, value) => option.userId === value.userId}
                  noOptionsText={t("roleAssignments.drawer.noMatchingUsers")}
                  onChange={(_, value) => {
                    if (!value) {
                      return;
                    }

                    setSelectedUserIds(current => current.includes(value.userId) ? current : [...current, value.userId]);
                  }}
                  openOnFocus
                  options={availableCandidates}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label={t("roleAssignments.drawer.user")}
                      placeholder={t("roleAssignments.drawer.searchUsers")}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.userId}>
                      <Stack spacing={0.25}>
                        <Typography>{option.userName}</Typography>
                        <FormSupportText>{option.workspaceName}</FormSupportText>
                      </Stack>
                    </li>
                  )}
                  slotProps={{
                    popper: {
                      modifiers: [
                        {
                          enabled: false,
                          name: "flip"
                        }
                      ],
                      placement: "bottom-start"
                    }
                  }}
                  value={null}
                />
              </FormFieldBlock>
              <FormFieldBlock>
                <Stack spacing={1.5}>
                  {selectedUsers.map(user => {
                    const workspaceName = "workspaceName" in user ? user.workspaceName : "";

                    return (
                      <Box
                        key={user.userId}
                        sx={{
                          border: "1px solid rgba(11,110,79,0.12)",
                          borderRadius: 1,
                          p: 1.5
                        }}
                      >
                        <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={1.5}>
                          <Stack spacing={0.25}>
                            <Typography>{user.userName}</Typography>
                            {workspaceName ? <FormSupportText>{workspaceName}</FormSupportText> : null}
                          </Stack>
                          <Chip
                            label={t("roleAssignments.drawer.remove")}
                            onDelete={() => {
                              setSelectedUserIds(current => current.filter(candidateId => candidateId !== user.userId));
                            }}
                            variant="outlined"
                          />
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </FormFieldBlock>
            </FormFieldList>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
              <Button
                aria-busy={isSaving}
                disabled={isSaving}
                onClick={() => {
                  void handleSubmit();
                }}
                variant="contained"
              >
                {isSaving ? t("common.saving") : t("common.save")}
              </Button>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Drawer>
  );
}
