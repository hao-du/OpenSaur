import { ComingSoonState } from "../../components/organisms";
import { ProtectedShellTemplate } from "../../components/templates";

export function WorkspacesPage() {
  return (
    <ProtectedShellTemplate
      subtitle="Workspace management and impersonation will be added in the next slice."
      title="Workspace"
    >
      <ComingSoonState description="Workspace listing, status updates, and login-as flows will land here next." />
    </ProtectedShellTemplate>
  );
}
