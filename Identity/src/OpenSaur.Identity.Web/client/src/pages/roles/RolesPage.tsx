import { ProtectedShellTemplate } from "../../components/templates";
import { isSuperAdministrator } from "../../app/router/protectedShellRoutes";
import {
  Button,
  Stack
} from "@mui/material";
import { useMemo, useState } from "react";
import { useCurrentUserState } from "../../features/auth/hooks";
import {
  RoleFiltersDrawer,
  type RoleFilterValues,
  RoleFormDrawer,
  RolesTable
} from "../../features/roles/components";
import {
  useCreateRole,
  useEditRole,
  usePermissionsQuery,
  useRoleQuery,
  useRolesQuery
} from "../../features/roles/hooks";

export function RolesPage() {
  const [filters, setFilters] = useState<RoleFilterValues>({
    search: "",
    status: "active"
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const { data: currentUser } = useCurrentUserState();
  const canManageRoleDefinitions = currentUser !== undefined
    && currentUser !== null
    && isSuperAdministrator(currentUser.roles);
  const {
    data: roles = [],
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
  } = usePermissionsQuery();
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
  const filteredRoles = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();
    return roles.filter(role => {
      const matchesSearch = !normalizedSearch
        || `${role.name} ${role.description}`.toLowerCase().includes(normalizedSearch);
      const matchesStatus = filters.status === "all"
        || (filters.status === "active" ? role.isActive : !role.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [filters, roles]);

  async function handleCreateRole(values: {
    description: string;
    isActive: boolean;
    name: string;
    permissionCodeIds: number[];
  }) {
    await createRole({
      description: values.description,
      name: values.name,
      permissionCodeIds: values.permissionCodeIds
    });
    setIsCreateDrawerOpen(false);
  }

  async function handleEditRole(values: {
    description: string;
    isActive: boolean;
    name: string;
    permissionCodeIds: number[];
  }) {
    if (!selectedRoleId) {
      return;
    }

    await editRole({
      description: values.description,
      id: selectedRoleId,
      isActive: values.isActive,
      name: values.name,
      permissionCodeIds: values.permissionCodeIds
    });
    setSelectedRoleId(null);
  }

  return (
    <ProtectedShellTemplate
      subtitle="Manage global role definitions and permission mapping from one place."
      title="Roles"
    >
      <Stack spacing={3}>
        <Stack
          direction={{ md: "row", xs: "column" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack direction="row" spacing={2}>
            <Button
              onClick={() => {
                setIsFilterDrawerOpen(true);
              }}
              variant="outlined"
            >
              Filter
            </Button>
          </Stack>
          {canManageRoleDefinitions ? (
            <Button
              onClick={() => {
                resetCreateError();
                setIsCreateDrawerOpen(true);
              }}
              variant="contained"
            >
              Create
            </Button>
          ) : null}
        </Stack>
        <RolesTable
          canEditDefinitions={Boolean(canManageRoleDefinitions)}
          isError={isError}
          isLoading={isLoading}
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
    </ProtectedShellTemplate>
  );
}
