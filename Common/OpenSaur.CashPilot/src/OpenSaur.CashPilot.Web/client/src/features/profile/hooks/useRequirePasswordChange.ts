import { useState } from "react";

export function useRequirePasswordChange() {
  const [isUpdating, setIsUpdating] = useState(false);

  const requirePasswordChange = async () => {
    setIsUpdating(true);
    // TODO: implement actual API call for CashPilot
    return new Promise(resolve => setTimeout(() => {
      setIsUpdating(false);
      resolve(void 0);
    }, 1000));
  };

  return { isUpdating, requirePasswordChange };
}
