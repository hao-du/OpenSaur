import { useEffect, useState } from "react";

type NetworkStatus = {
  isChecking: boolean;
  isOnline: boolean | null;
};

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean | null>(
    typeof window === "undefined" ? null : window.navigator.onLine,
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isChecking: false, isOnline };
}
