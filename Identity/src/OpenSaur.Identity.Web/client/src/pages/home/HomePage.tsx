import { ProtectedShellTemplate } from "../../components/templates";
import { Box } from "@mui/material";

export function HomePage() {
  return (
    <ProtectedShellTemplate title="Dashboard">
      <Box sx={{ minHeight: { xs: 280, md: 420 } }} />
    </ProtectedShellTemplate>
  );
}
