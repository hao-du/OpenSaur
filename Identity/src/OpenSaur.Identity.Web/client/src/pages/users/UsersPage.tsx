import { ComingSoonState } from "../../components/organisms";
import { ProtectedShellTemplate } from "../../components/templates";

export function UsersPage() {
  return (
    <ProtectedShellTemplate
      subtitle="User management screens will be added in the next slice."
      title="Users"
    >
      <ComingSoonState description="Add, edit, deactivate, and role-assignment workflows will land here next." />
    </ProtectedShellTemplate>
  );
}
