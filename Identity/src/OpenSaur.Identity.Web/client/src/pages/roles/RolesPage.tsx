import { ComingSoonState } from "../../components/organisms";
import { ProtectedShellTemplate } from "../../components/templates";

export function RolesPage() {
  return (
    <ProtectedShellTemplate
      subtitle="Role management and permission assignment will be added in the next slice."
      title="Roles"
    >
      <ComingSoonState description="Role activation, permission mapping, and user assignment workflows will land here next." />
    </ProtectedShellTemplate>
  );
}
