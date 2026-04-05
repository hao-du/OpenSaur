import { useMemo, useState } from "react";
import {
  Button,
  Stack
} from "@mui/material";
import { ProtectedShellTemplate } from "../../components/templates";
import {
  WorkspaceFiltersDrawer,
  type WorkspaceFilterValues,
  WorkspaceFormDrawer,
  WorkspaceImpersonationDialog,
  WorkspaceTable
} from "../../features/workspaces/components";
import {
  useImpersonationOptionsQuery,
  useStartImpersonation
} from "../../features/auth/hooks";
import { useRolesQuery } from "../../features/roles/hooks";
import { usePreferences } from "../../features/preferences/PreferenceProvider";
import {
  useCreateWorkspace,
  useEditWorkspace,
  useWorkspaceQuery,
  useWorkspacesQuery
} from "../../features/workspaces/hooks";

export function WorkspacesPage() {
  const [filters, setFilters] = useState<WorkspaceFilterValues>({
    search: "",
    status: "active"
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [impersonationWorkspaceId, setImpersonationWorkspaceId] = useState<string | null>(null);
  const { t } = usePreferences();
  const { data: roles = [], isLoading: isRolesLoading } = useRolesQuery();
  const {
    data: workspaces = [],
    isError,
    isLoading,
    refetch
  } = useWorkspacesQuery();
  const {
    data: impersonationOptions,
    isError: isImpersonationOptionsError,
    isLoading: isImpersonationOptionsLoading
  } = useImpersonationOptionsQuery(impersonationWorkspaceId);
  const {
    createWorkspace,
    errorMessage: createErrorMessage,
    isCreating,
    resetError: resetCreateError
  } = useCreateWorkspace();
  const {
    editWorkspace,
    errorMessage: editErrorMessage,
    isEditing,
    resetError: resetEditError
  } = useEditWorkspace();
  const {
    errorMessage: startImpersonationErrorMessage,
    isStartingImpersonation,
    resetError: resetStartImpersonationError,
    startImpersonation
  } = useStartImpersonation();
  const {
    data: selectedWorkspace,
    isLoading: isSelectedWorkspaceLoading
  } = useWorkspaceQuery(selectedWorkspaceId);
  const filteredWorkspaces = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();
    return workspaces.filter(workspace => {
      const matchesSearch = !normalizedSearch
        || `${workspace.name} ${workspace.description}`.toLowerCase().includes(normalizedSearch);
      const matchesStatus = filters.status === "all"
        || (filters.status === "active" ? workspace.isActive : !workspace.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [filters, workspaces]);
  const roleNamesById = useMemo(
    () => Object.fromEntries(roles.map(role => [role.id, role.name])),
    [roles]
  );
  const defaultAssignedRoleIds = useMemo(
    () => roles
      .filter(role => role.isActive && role.normalizedName !== "SUPERADMINISTRATOR")
      .slice(0, 2)
      .map(role => role.id),
    [roles]
  );

  function normalizeMaxActiveUsers(value: string) {
    const trimmedValue = value.trim();
    return trimmedValue.length === 0 ? null : Number(trimmedValue);
  }

  async function handleCreateWorkspace(values: {
    description: string;
    isActive: boolean;
    maxActiveUsers: string;
    name: string;
    selectedRoleIds: string[];
  }) {
    await createWorkspace({
      assignedRoleIds: values.selectedRoleIds,
      description: values.description,
      maxActiveUsers: normalizeMaxActiveUsers(values.maxActiveUsers),
      name: values.name
    });
    setIsCreateDrawerOpen(false);
  }

  async function handleEditWorkspace(values: {
    description: string;
    isActive: boolean;
    maxActiveUsers: string;
    name: string;
    selectedRoleIds: string[];
  }) {
    if (!selectedWorkspaceId) {
      return;
    }

    await editWorkspace({
      assignedRoleIds: values.selectedRoleIds,
      description: values.description,
      id: selectedWorkspaceId,
      isActive: values.isActive,
      maxActiveUsers: normalizeMaxActiveUsers(values.maxActiveUsers),
      name: values.name
    });
    setSelectedWorkspaceId(null);
  }

  async function handleStartImpersonation(values: { userId: string | null; workspaceId: string; }) {
    const transition = await startImpersonation({
      ...values,
      returnUrl: "/"
    });
    setImpersonationWorkspaceId(null);
    window.location.assign(transition.redirectUrl);
  }

  return (
    <ProtectedShellTemplate
      subtitle={t("workspaces.description")}
      title={t("workspaces.title")}
    >
      <Stack spacing={3}>
        <Stack
          direction={{ md: "row", xs: "column" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack
            direction="row"
            spacing={2}
          >
            <Button
              onClick={() => {
                setIsFilterDrawerOpen(true);
              }}
              variant="outlined"
            >
              {t("common.filter")}
            </Button>
          </Stack>
          <Button
            onClick={() => {
              resetCreateError();
              setIsCreateDrawerOpen(true);
            }}
            variant="contained"
          >
            {t("common.create")}
          </Button>
        </Stack>
        <WorkspaceTable
          isError={isError}
          isLoading={isLoading}
          onEditWorkspace={workspaceId => {
            resetEditError();
            setSelectedWorkspaceId(workspaceId);
          }}
          onLoginAsWorkspace={workspaceId => {
            resetStartImpersonationError();
            setImpersonationWorkspaceId(workspaceId);
          }}
          onRetry={() => {
            void refetch();
          }}
          roleNamesById={roleNamesById}
          workspaces={filteredWorkspaces}
        />
      </Stack>
      <WorkspaceFiltersDrawer
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
      <WorkspaceFormDrawer
        availableRoles={roles}
        defaultAssignedRoleIds={defaultAssignedRoleIds}
        errorMessage={createErrorMessage}
        isEditMode={false}
        isLoading={isRolesLoading}
        isOpen={isCreateDrawerOpen}
        isSubmitting={isCreating}
        onClose={() => {
          setIsCreateDrawerOpen(false);
        }}
        onSubmit={handleCreateWorkspace}
      />
      <WorkspaceFormDrawer
        availableRoles={roles}
        defaultAssignedRoleIds={defaultAssignedRoleIds}
        errorMessage={editErrorMessage}
        initialValues={selectedWorkspace}
        isEditMode
        isLoading={isSelectedWorkspaceLoading || isRolesLoading}
        isOpen={selectedWorkspaceId !== null}
        isSubmitting={isEditing}
        onClose={() => {
          setSelectedWorkspaceId(null);
        }}
        onSubmit={handleEditWorkspace}
      />
      <WorkspaceImpersonationDialog
        errorMessage={
          isImpersonationOptionsError
            ? t("workspaces.impersonation.loadError")
            : startImpersonationErrorMessage
        }
        isLoading={isImpersonationOptionsLoading}
        isOpen={impersonationWorkspaceId !== null}
        isSubmitting={isStartingImpersonation}
        onClose={() => {
          setImpersonationWorkspaceId(null);
        }}
        onSubmit={handleStartImpersonation}
        options={impersonationOptions ?? null}
      />
    </ProtectedShellTemplate>
  );
}
