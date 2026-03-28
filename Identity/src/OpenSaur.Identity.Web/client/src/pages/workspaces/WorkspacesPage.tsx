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
  WorkspaceTable
} from "../../features/workspaces/components";
import {
  useCreateWorkspace,
  useEditWorkspace,
  useWorkspaceQuery,
  useWorkspacesQuery
} from "../../features/workspaces/hooks";

export function WorkspacesPage() {
  const [filters, setFilters] = useState<WorkspaceFilterValues>({
    search: "",
    status: "all"
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const {
    data: workspaces = [],
    isError,
    isLoading,
    refetch
  } = useWorkspacesQuery();
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

  async function handleCreateWorkspace(values: { description: string; isActive: boolean; name: string; }) {
    await createWorkspace({
      description: values.description,
      name: values.name
    });
    setIsCreateDrawerOpen(false);
  }

  async function handleEditWorkspace(values: { description: string; isActive: boolean; name: string; }) {
    if (!selectedWorkspaceId) {
      return;
    }

    await editWorkspace({
      description: values.description,
      id: selectedWorkspaceId,
      isActive: values.isActive,
      name: values.name
    });
    setSelectedWorkspaceId(null);
  }

  return (
    <ProtectedShellTemplate
      subtitle="Manage workspace access surfaces, activation state, and future administration flows from one place."
      title="Workspace"
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
              Filter
            </Button>
          </Stack>
          <Button
            onClick={() => {
              resetCreateError();
              setIsCreateDrawerOpen(true);
            }}
            variant="contained"
          >
            Create workspace
          </Button>
        </Stack>
        <WorkspaceTable
          isError={isError}
          isLoading={isLoading}
          onEditWorkspace={workspaceId => {
            resetEditError();
            setSelectedWorkspaceId(workspaceId);
          }}
          onRetry={() => {
            void refetch();
          }}
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
        errorMessage={createErrorMessage}
        isEditMode={false}
        isLoading={false}
        isOpen={isCreateDrawerOpen}
        isSubmitting={isCreating}
        onClose={() => {
          setIsCreateDrawerOpen(false);
        }}
        onSubmit={handleCreateWorkspace}
      />
      <WorkspaceFormDrawer
        errorMessage={editErrorMessage}
        initialValues={selectedWorkspace}
        isEditMode
        isLoading={isSelectedWorkspaceLoading}
        isOpen={selectedWorkspaceId !== null}
        isSubmitting={isEditing}
        onClose={() => {
          setSelectedWorkspaceId(null);
        }}
        onSubmit={handleEditWorkspace}
      />
    </ProtectedShellTemplate>
  );
}
