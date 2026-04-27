import { Button, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { useAuthSession } from "../../auth/hooks/AuthContext";
import { useCurrentProfileQuery } from "../../profile/hooks/useCurrentProfileQuery";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { RoleFiltersDrawer, type RoleFilterValues } from "../components/RoleFiltersDrawer";
import { RoleFormDrawer } from "../components/RoleFormDrawer";
import { RoleUsersDrawer } from "../components/RoleUsersDrawer";
import { RolesTable } from "../components/RolesTable";
import { useCreateRole } from "../hooks/useCreateRole";
import { useEditRole } from "../hooks/useEditRole";
import { usePermissionsQuery } from "../hooks/usePermissionsQuery";
import { useRoleQuery } from "../hooks/useRoleQuery";
import { useRolesQuery } from "../hooks/useRolesQuery";
import { useRoleUsersQuery } from "../hooks/useRoleUsersQuery";
import { useUpdateRoleUsers } from "../hooks/useUpdateRoleUsers";
import type { RoleFormValues } from "../components/RoleForm";

export function RolesPage() {
  const navigate = useNavigate();
  const { clearSession } = useAuthSession();
  const { data: currentProfile } = useCurrentProfileQuery();
  const canEditRoles = currentProfile?.canEditRoles === true;
  const canAssignUsers = currentProfile?.canAssignUsers === true && !canEditRoles;
  const [filters, setFilters] = useState<RoleFilterValues>({
    search: "",
    status: "active"
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedRoleUsersRoleId, setSelectedRoleUsersRoleId] = useState<string | null>(null);
  const {
    data: roles = [],
    isForbidden,
    isUnauthorized,
    isError,
    isLoading,
    refetch
  } = useRolesQuery();
  const {
    data: selectedRole,
    isLoading: isSelectedRoleLoading
  } = useRoleQuery(selectedRoleId);
  const {
    data: permissions = [],
    isLoading: isPermissionsLoading
  } = usePermissionsQuery(canEditRoles);
  const {
    data: roleUsers,
    isLoading: isRoleUsersLoading
  } = useRoleUsersQuery(selectedRoleUsersRoleId);
  const {
    createRole,
    errorMessage: createErrorMessage,
    isCreating,
    resetError: resetCreateError
  } = useCreateRole();
  const {
    editRole,
    errorMessage: editErrorMessage,
    isEditing,
    resetError: resetEditError
  } = useEditRole();
  const {
    errorMessage: updateRoleUsersErrorMessage,
    isUpdating: isUpdatingRoleUsers,
    resetError: resetUpdateRoleUsersError,
    updateRoleUsers
  } = useUpdateRoleUsers();
  const filteredRoles = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();

    return roles.filter(role => {
      const matchesSearch = normalizedSearch.length === 0
        || `${role.name} ${role.description}`.toLowerCase().includes(normalizedSearch);
      const matchesStatus = filters.status === "all"
        || (filters.status === "active" ? role.isActive : !role.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [filters, roles]);

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

  async function handleCreateRole(values: RoleFormValues) {
    await createRole({
      description: values.description,
      name: values.name,
      permissionCodes: values.permissionCodes
    });
    setIsCreateDrawerOpen(false);
  }

  async function handleEditRole(values: RoleFormValues) {
    if (selectedRoleId == null) {
      return;
    }

    await editRole({
      description: values.description,
      id: selectedRoleId,
      isActive: values.isActive,
      name: values.name,
      permissionCodes: values.permissionCodes
    });
    setSelectedRoleId(null);
  }

  return (
    <DefaultLayout
      subtitle="Manage role definitions and permission assignments."
      title="Roles"
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
          {canEditRoles ? (
            <Button
              onClick={() => {
                resetCreateError();
                setIsCreateDrawerOpen(true);
              }}
              sx={layoutStyles.responsiveActionButton}
              variant="contained"
            >
              Create
            </Button>
          ) : null}
        </Stack>
        <RolesTable
          canAssignUsers={canAssignUsers}
          canEditRoles={canEditRoles}
          isError={isError}
          isLoading={isLoading}
          onAssignUsers={roleId => {
            resetUpdateRoleUsersError();
            setSelectedRoleUsersRoleId(roleId);
          }}
          onEditRole={roleId => {
            resetEditError();
            setSelectedRoleId(roleId);
          }}
          onRetry={() => {
            void refetch();
          }}
          roles={filteredRoles}
        />
      </Stack>
      <RoleFiltersDrawer
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
      {canEditRoles ? (
        <>
          <RoleFormDrawer
            errorMessage={createErrorMessage}
            isEditMode={false}
            isLoading={isPermissionsLoading}
            isOpen={isCreateDrawerOpen}
            isSubmitting={isCreating}
            onClose={() => {
              setIsCreateDrawerOpen(false);
            }}
            onSubmit={handleCreateRole}
            permissions={permissions}
          />
          <RoleFormDrawer
            errorMessage={editErrorMessage}
            initialValues={selectedRole}
            isEditMode
            isLoading={isPermissionsLoading || isSelectedRoleLoading}
            isOpen={selectedRoleId !== null}
            isSubmitting={isEditing}
            onClose={() => {
              setSelectedRoleId(null);
            }}
            onSubmit={handleEditRole}
            permissions={permissions}
          />
        </>
      ) : null}
      {canAssignUsers ? (
        <RoleUsersDrawer
          errorMessage={updateRoleUsersErrorMessage}
          isLoading={isRoleUsersLoading}
          isOpen={selectedRoleUsersRoleId !== null}
          isSubmitting={isUpdatingRoleUsers}
          onClose={() => {
            setSelectedRoleUsersRoleId(null);
          }}
          onSubmit={async userIds => {
            if (selectedRoleUsersRoleId == null) {
              return;
            }

            await updateRoleUsers({
              request: { userIds },
              roleId: selectedRoleUsersRoleId
            });
            setSelectedRoleUsersRoleId(null);
          }}
          roleUsers={roleUsers}
        />
      ) : null}
    </DefaultLayout>
  );
}
