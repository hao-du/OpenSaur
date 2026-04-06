import {
  Button,
  Stack
} from "@mui/material";
import { useMemo, useState } from "react";
import { ProtectedShellTemplate } from "../../components/templates";
import { useCurrentUserState } from "../../features/auth/hooks";
import { usePreferences } from "../../features/preferences/PreferenceProvider";
import {
  UserFiltersDrawer,
  type UserFilterValues,
  UserFormDrawer,
  UsersTable
} from "../../features/users/components";
import {
  useCreateUser,
  useEditUser,
  useRoleCandidatesQuery,
  useSaveUserAssignments,
  useUserAssignmentsQuery,
  useUserQuery,
  useUsersQuery
} from "../../features/users/hooks";

export function UsersPage() {
  const [filters, setFilters] = useState<UserFilterValues>({
    search: "",
    status: "active"
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { data: currentUser } = useCurrentUserState();
  const { t } = usePreferences();
  const {
    data: users = [],
    isError,
    isLoading,
    refetch
  } = useUsersQuery();
  const {
    data: selectedUser,
    isLoading: isSelectedUserLoading
  } = useUserQuery(selectedUserId);
  const {
    data: assignments = [],
    isLoading: isAssignmentsLoading
  } = useUserAssignmentsQuery(selectedUserId);
  const {
    data: roleCandidates = [],
    isLoading: isRoleCandidatesLoading
  } = useRoleCandidatesQuery();
  const {
    createUser,
    errorMessage: createErrorMessage,
    isCreating,
    resetError: resetCreateError
  } = useCreateUser();
  const {
    editUser,
    errorMessage: editErrorMessage,
    isEditing,
    resetError: resetEditError
  } = useEditUser();
  const {
    errorMessage: saveAssignmentsErrorMessage,
    isSaving,
    resetError: resetSaveAssignmentsError,
    saveUserAssignments
  } = useSaveUserAssignments();
  const filteredUsers = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();

    return users.filter(user => {
      const matchesSearch = !normalizedSearch
        || `${user.userName} ${user.firstName ?? ""} ${user.lastName ?? ""} ${user.email}`.toLowerCase().includes(normalizedSearch);
      const matchesStatus = filters.status === "all"
        || (filters.status === "active" ? user.isActive : !user.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [filters, users]);

  async function handleCreateUser(values: {
    description: string;
    email: string;
    firstName: string;
    isActive: boolean;
    lastName: string;
    password: string;
    selectedRoleIds: string[];
    userName: string;
  }) {
    const createdUser = await createUser({
      description: values.description,
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      password: values.password,
      userName: values.userName,
      userSettings: "{}"
    });

    await saveUserAssignments({
      assignments: [],
      selectedRoleIds: values.selectedRoleIds,
      userId: createdUser.id
    });
    setIsCreateDrawerOpen(false);
  }

  async function handleEditUser(values: {
    description: string;
    email: string;
    firstName: string;
    isActive: boolean;
    lastName: string;
    password: string;
    selectedRoleIds: string[];
    userName: string;
  }) {
    if (!selectedUserId) {
      return;
    }

    await editUser({
      description: values.description,
      email: values.email,
      firstName: values.firstName,
      id: selectedUserId,
      isActive: values.isActive,
      lastName: values.lastName,
      userName: values.userName,
      userSettings: selectedUser?.userSettings ?? "{}"
    });
    await saveUserAssignments({
      assignments,
      selectedRoleIds: values.selectedRoleIds,
      userId: selectedUserId
    });
    setSelectedUserId(null);
  }

  return (
    <ProtectedShellTemplate
      subtitle={t("users.description", {
        workspaceName: currentUser?.workspaceName ?? t("common.currentWorkspace")
      })}
      title={t("users.title")}
    >
      <Stack spacing={3}>
        <Stack
          direction={{ md: "row", xs: "column" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack direction="row" spacing={2} sx={{ width: { md: "auto", xs: "100%" } }}>
            <Button
              onClick={() => {
                setIsFilterDrawerOpen(true);
              }}
              sx={{ width: { md: "auto", xs: "100%" } }}
              variant="outlined"
            >
              {t("common.filter")}
            </Button>
          </Stack>
          <Button
            onClick={() => {
              resetCreateError();
              resetSaveAssignmentsError();
              setIsCreateDrawerOpen(true);
            }}
            sx={{ width: { md: "auto", xs: "100%" } }}
            variant="contained"
          >
            {t("common.create")}
          </Button>
        </Stack>
        <UsersTable
          isError={isError}
          isLoading={isLoading}
          onEditUser={userId => {
            resetEditError();
            resetSaveAssignmentsError();
            setSelectedUserId(userId);
          }}
          onRetry={() => {
            void refetch();
          }}
          users={filteredUsers}
        />
      </Stack>
      <UserFiltersDrawer
        initialValues={filters}
        isOpen={isFilterDrawerOpen}
        onApply={async nextFilters => {
          await Promise.resolve();
          setFilters(nextFilters);
          setIsFilterDrawerOpen(false);
        }}
        onClose={() => {
          setIsFilterDrawerOpen(false);
        }}
      />
      <UserFormDrawer
        errorMessage={createErrorMessage ?? saveAssignmentsErrorMessage}
        initialValues={null}
        isEditMode={false}
        isLoading={isRoleCandidatesLoading}
        isOpen={isCreateDrawerOpen}
        isSubmitting={isCreating || isSaving}
        onClose={() => {
          setIsCreateDrawerOpen(false);
        }}
        onSubmit={handleCreateUser}
        roleCandidates={roleCandidates}
        userAssignments={[]}
      />
      <UserFormDrawer
        errorMessage={editErrorMessage ?? saveAssignmentsErrorMessage}
        initialValues={selectedUser}
        isEditMode
        isLoading={isSelectedUserLoading || isAssignmentsLoading || isRoleCandidatesLoading}
        isOpen={selectedUserId !== null}
        isSubmitting={isEditing || isSaving}
        onClose={() => {
          setSelectedUserId(null);
        }}
        onSubmit={handleEditUser}
        roleCandidates={roleCandidates}
        userAssignments={assignments}
      />
    </ProtectedShellTemplate>
  );
}
