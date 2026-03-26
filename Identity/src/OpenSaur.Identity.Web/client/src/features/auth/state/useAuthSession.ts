import { useSyncExternalStore } from "react";
import { authSessionStore } from "./authSessionStore";

export function useAuthSession() {
  return useSyncExternalStore(
    authSessionStore.subscribe,
    authSessionStore.getSnapshot,
    authSessionStore.getSnapshot
  );
}
