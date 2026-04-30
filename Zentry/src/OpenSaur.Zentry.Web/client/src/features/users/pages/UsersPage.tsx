import { Button, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useAuthSession } from "../../auth/hooks/AuthContext";
import { AssignUserRolesDrawer } from "../components/AssignUserRolesDrawer";
import { ResetUserPasswordDrawer } from "../components/ResetUserPasswordDrawer";
import { UserFiltersDrawer, type UserFilterValues } from "../components/UserFiltersDrawer";
import { UserFormDrawer } from "../components/UserFormDrawer";
import { UsersTable } from "../components/UsersTable";
import { useAssignUserRoles } from "../hooks/useAssignUserRoles";
import { useResetUserPassword } from "../hooks/useResetUserPassword";
import { useUserQuery } from "../hooks/useUserQuery";
import { useUserRolesQuery } from "../hooks/useUserRolesQuery";
import { useUsersQuery } from "../hooks/useUsersQuery";

export function UsersPage() {
  const navigate = useNavigate();
  const { clearSession } = useAuthSession();
  const [filters, setFilters] = useState<UserFilterValues>({
    search: "",
    status: "active"
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<{ id: string; userName: string } | null>(null);
  const [assignRolesUserId, setAssignRolesUserId] = useState<string | null>(null);
  const { data: users = [], isForbidden, isUnauthorized, isError, isLoading, refetch } = useUsersQuery();
  const { data: selectedUser, isLoading: isSelectedUserLoading } = useUserQuery(selectedUserId);
  const { data: userRoles, isLoading: isUserRolesLoading } = useUserRolesQuery(assignRolesUserId);
  const { errorMessage: resetPasswordErrorMessage, isResetting, resetError: resetResetPasswordError, resetUserPassword } = useResetUserPassword();
  const { assignUserRoles, errorMessage: assignUserRolesErrorMessage, isAssigning, resetError: resetAssignUserRolesError } = useAssignUserRoles();
  
  const filteredUsers = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();

    return users.filter(user => {
      const matchesSearch = normalizedSearch.length === 0
        || [
          user.userName,
          user.email,
          user.firstName,
          user.lastName,
          user.description,
          ...user.roleNames
        ].join(" ").toLowerCase().includes(normalizedSearch);
      const matchesStatus = filters.status === "all" || (filters.status === "active" ? user.isActive : !user.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [filters, users]);

  useEffect(() => {
    if (!isUnauthorized) {
      return;
    }

    clearSession();
    navigate("/prepare-session", { replace: true });
  }, [clearSession, isUnauthorized, navigate]);

  useEffect(() => {
    if (!isForbidden) {
      return;
    }

    navigate("/forbidden", { replace: true });
  }, [isForbidden, navigate]);

  return (
    <DefaultLayout
      subtitle="Manage users in the current workspace."
      title="Users"
    >
      <Stack spacing={3}>
        <Stack direction={{ md: "row", xs: "column" }} justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={2} sx={layoutStyles.responsiveActionGroup}>
            <Button
              onClick={() => {
                setIsFilterDrawerOpen(true);
              }}
              sx={layoutStyles.responsiveActionButton}
              variant="outlined"
            >
              Filter
            </Button>
          </Stack>
          <Button
            onClick={() => {
              setIsCreateDrawerOpen(true);
            }}
            sx={layoutStyles.responsiveActionButton}
            variant="contained"
          >
            Create
          </Button>
        </Stack>
        <UsersTable
          isError={isError}
          isLoading={isLoading}
          onAssignRoles={userId => {
            resetAssignUserRolesError();
            setAssignRolesUserId(userId);
          }}
          onEditUser={userId => {
            setSelectedUserId(userId);
          }}
          onResetPassword={(id, userName) => {
            resetResetPasswordError();
            setResetPasswordUser({ id, userName });
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
        isEditMode={false}
        isLoading={false}
        isOpen={isCreateDrawerOpen}
        onClose={() => {
          setIsCreateDrawerOpen(false);
        }}
      />
      <UserFormDrawer
        initialValues={selectedUser}
        isEditMode
        isLoading={isSelectedUserLoading}
        isOpen={selectedUserId !== null}
        onClose={() => {
          setSelectedUserId(null);
        }}
      />
      <ResetUserPasswordDrawer
        errorMessage={resetPasswordErrorMessage}
        isOpen={resetPasswordUser !== null}
        isSubmitting={isResetting}
        onClose={() => {
          setResetPasswordUser(null);
        }}
        onSubmit={async password => {
          if (resetPasswordUser == null) {
            return;
          }

          await resetUserPassword({
            request: { password },
            userId: resetPasswordUser.id
          });
          setResetPasswordUser(null);
        }}
        userName={resetPasswordUser?.userName}
      />
      <AssignUserRolesDrawer
        errorMessage={assignUserRolesErrorMessage}
        isLoading={isUserRolesLoading}
        isOpen={assignRolesUserId !== null}
        isSubmitting={isAssigning}
        onClose={() => {
          setAssignRolesUserId(null);
        }}
        onSubmit={async roleIds => {
          if (assignRolesUserId == null) {
            return;
          }

          await assignUserRoles({
            request: { roleIds },
            userId: assignRolesUserId
          });
          setAssignRolesUserId(null);
        }}
        userRoles={userRoles}
      />
    </DefaultLayout>
  );
}
