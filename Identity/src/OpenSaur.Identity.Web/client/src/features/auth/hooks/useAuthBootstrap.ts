import { useAuthSession } from "../state/useAuthSession";

export function useAuthBootstrap() {
  const session = useAuthSession();

  return {
    isBootstrapping: false,
    session
  };
}
