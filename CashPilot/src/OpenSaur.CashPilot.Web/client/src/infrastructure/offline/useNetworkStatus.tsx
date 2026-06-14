import { useSyncExternalStore } from "react";
import { client } from "../http/client";

type NetworkStatus = {
  isChecking: boolean;
  isOnline: boolean | null;
};

type NetworkStatusState = NetworkStatus;

const initialState: NetworkStatusState = {
  isChecking: true,
  isOnline: null,
};

let state: NetworkStatusState = initialState;
const listeners = new Set<() => void>();
let isStarted = false;
let handleOnline: (() => void) | null = null;
let handleOffline: (() => void) | null = null;

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function setState(nextState: Partial<NetworkStatusState>) {
  state = { ...state, ...nextState };
  notify();
}

async function probeConnectivity() {
  try {
    await client.head("/api/offline-probe", { skipAuth: true });
    setState({ isOnline: true });
  } catch {
    setState({ isOnline: false });
  } finally {
    setState({ isChecking: false });
  }
}

function startNetworkTracking() {
  if (typeof window === "undefined" || isStarted) {
    return;
  }

  isStarted = true;

  handleOnline = () => {
    setState({ isOnline: true });
  };

  handleOffline = () => {
    setState({ isOnline: false });
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  void probeConnectivity();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  startNetworkTracking();

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): NetworkStatusState {
  return state;
}

function getServerSnapshot(): NetworkStatusState {
  return initialState;
}

export function useNetworkStatus(): NetworkStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
