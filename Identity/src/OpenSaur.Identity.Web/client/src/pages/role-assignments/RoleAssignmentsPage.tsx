import { ProtectedShellTemplate } from "../../components/templates";
import { useMemo, useState } from "react";
import {
  Button,
  Stack
} from "@mui/material";
import { useCurrentUserState } from "../../features/auth/hooks";
import { usePreferences } from "../../features/preferences/PreferenceProvider";
import {
  RoleAssignmentsEditorDrawer,
  RoleAssignmentsTable
} from "../../features/role-assignments/components";
import {
  RoleFiltersDrawer,
  type RoleFilterValues
} from "../../features/roles/components";
import {
  useAssignmentCandidatesQuery,
  useAvailableRolesQuery,
  useRoleAssignmentsQuery,
  useSaveRoleAssignments
} from "../../features/role-assignments/hooks";

export function RoleAssignmentsPage() {
  const [filters, setFilters] = useState<RoleFilterValues>({
    search: "",
    status: "active"
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const { data: currentUser } = useCurrentUserState();
  const { t } = usePreferences();
  const {
    data: roles = [],
    isError: isRolesError,
    isLoading: isRolesLoading,
    refetch
  } = useAvailableRolesQuery();
  const selectedRole = useMemo(
    () => roles.find(role => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  );
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
  const {
    data: assignments = [],
    isLoading: isAssignmentsLoading
  } = useRoleAssignmentsQuery(selectedRoleId);
  const {
    data: assignmentCandidates = [],
    isLoading: isAssignmentCandidatesLoading
  } = useAssignmentCandidatesQuery();
  const {
    errorMessage,
    isSaving,
    resetError,
    saveRoleAssignments
  } = useSaveRoleAssignments();

  return (
    <ProtectedShellTemplate
      subtitle={t("roleAssignments.subtitle", {
        workspaceName: currentUser?.workspaceName ?? t("common.currentWorkspace")
      })}
      title={t("roleAssignments.title")}
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
        </Stack>
        <RoleAssignmentsTable
          isError={isRolesError}
          isLoading={isRolesLoading}
          onEditAssignments={roleId => {
            resetError();
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
      <RoleAssignmentsEditorDrawer
        assignmentCandidates={assignmentCandidates}
        assignmentErrorMessage={errorMessage}
        assignments={assignments}
        isLoadingAssignments={isAssignmentsLoading}
        isLoadingCandidates={isAssignmentCandidatesLoading}
        isOpen={selectedRoleId !== null}
        isSaving={isSaving}
        onClose={() => {
          setSelectedRoleId(null);
        }}
        onSubmit={async values => {
          await saveRoleAssignments({
            assignments,
            roleId: values.roleId,
            selectedUserIds: values.selectedUserIds
          });
          setSelectedRoleId(null);
        }}
        role={selectedRole}
      />
    </ProtectedShellTemplate>
  );
}
