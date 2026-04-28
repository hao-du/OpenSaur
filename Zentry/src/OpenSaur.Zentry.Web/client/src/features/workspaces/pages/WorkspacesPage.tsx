import { Button, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { getConfig } from "../../../infrastructure/config/Config";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useAuthSession } from "../../auth/hooks/AuthContext";
import { buildAuthorizeUrl } from "../../auth/services/UriService";
import { WorkspaceFiltersDrawer, type WorkspaceFilterValues } from "../components/WorkspaceFiltersDrawer";
import { WorkspaceFormDrawer } from "../components/WorkspaceFormDrawer";
import { WorkspaceImpersonationDialog } from "../components/WorkspaceImpersonationDialog";
import { WorkspaceTable } from "../components/WorkspaceTable";
import { useAssignableWorkspaceRolesQuery } from "../hooks/useAssignableWorkspaceRolesQuery";
import { useUsersForImpersonationByWorkspaceIdQuery } from "../hooks/useUsersForImpersonationByWorkspaceIdQuery";
import { useWorkspaceQuery } from "../hooks/useWorkspaceQuery";
import { useWorkspacesQuery } from "../hooks/useWorkspacesQuery";

export function WorkspacesPage() {
  const navigate = useNavigate();
  const { clearSession } = useAuthSession();
  const [filters, setFilters] = useState<WorkspaceFilterValues>({
    search: "",
    status: "active"
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [impersonationWorkspaceId, setImpersonationWorkspaceId] = useState<string | null>(null);
  const [impersonationErrorMessage, setImpersonationErrorMessage] = useState<string | null>(null);
  const [isStartingImpersonation, setIsStartingImpersonation] = useState(false);
  const {
    data: workspaces = [],
    isForbidden,
    isUnauthorized,
    isError,
    isLoading,
    refetch
  } = useWorkspacesQuery();
  const {
    data: assignableRoles = [],
    isLoading: isAssignableRolesLoading
  } = useAssignableWorkspaceRolesQuery();
  const {
    data: selectedWorkspace,
    isLoading: isSelectedWorkspaceLoading
  } = useWorkspaceQuery(selectedWorkspaceId);
  const {
    data: usersForImpersonation,
    isError: isUsersForImpersonationError,
    isLoading: isUsersForImpersonationLoading
  } = useUsersForImpersonationByWorkspaceIdQuery(impersonationWorkspaceId);
  const filteredWorkspaces = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();

    return workspaces.filter(workspace => {
      const matchesSearch = normalizedSearch.length === 0
        || `${workspace.name} ${workspace.description}`.toLowerCase().includes(normalizedSearch);
      const matchesStatus = filters.status === "all"
        || (filters.status === "active" ? workspace.isActive : !workspace.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [filters, workspaces]);

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

  async function handleStartImpersonation(values: { userId: string; workspaceId: string }) {
    try {
      setIsStartingImpersonation(true);
      const authorizeUrl = await buildAuthorizeUrl(getConfig(), {
        impersonatedUserId: values.userId,
        workspaceId: values.workspaceId
      });
      window.location.assign(authorizeUrl);
    } catch (error) {
      setIsStartingImpersonation(false);
      setImpersonationErrorMessage(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Unable to start impersonation."
      );
    }
  }

  return (
    <DefaultLayout
      subtitle="Manage workspaces and the roles available inside each workspace."
      title="Workspaces"
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
        <WorkspaceTable
          availableRoles={assignableRoles}
          isError={isError}
          isLoading={isLoading}
          onEditWorkspace={workspaceId => {
            setSelectedWorkspaceId(workspaceId);
          }}
          onImpersonateWorkspace={workspaceId => {
            setImpersonationErrorMessage(null);
            setImpersonationWorkspaceId(workspaceId);
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
        availableRoles={assignableRoles}
        isEditMode={false}
        isLoading={isAssignableRolesLoading}
        isOpen={isCreateDrawerOpen}
        onClose={() => {
          setIsCreateDrawerOpen(false);
        }}
      />
      <WorkspaceFormDrawer
        availableRoles={assignableRoles}
        initialValues={selectedWorkspace}
        isEditMode
        isLoading={isSelectedWorkspaceLoading || isAssignableRolesLoading}
        isOpen={selectedWorkspaceId !== null}
        onClose={() => {
          setSelectedWorkspaceId(null);
        }}
      />
      <WorkspaceImpersonationDialog
        errorMessage={
          isUsersForImpersonationError
            ? "Unable to load workspace users."
            : impersonationErrorMessage
        }
        isLoading={isUsersForImpersonationLoading}
        isOpen={impersonationWorkspaceId !== null}
        isSubmitting={isStartingImpersonation}
        onClose={() => {
          setImpersonationWorkspaceId(null);
          setImpersonationErrorMessage(null);
        }}
        onSubmit={handleStartImpersonation}
        usersForImpersonation={usersForImpersonation ?? null}
      />
    </DefaultLayout>
  );
}
