import { useQuery } from "@tanstack/react-query";
import { currentUserQueryOptions } from "../queries/authQueries";
import { useAuthSession } from "../state/useAuthSession";

export function useCurrentUserState() {
  const session = useAuthSession();

  return useQuery({
    ...currentUserQueryOptions(),
    enabled: session.status === "authenticated"
  });
}
